/*
	include.js
	
	version: 2017.11.22
*/

var include = (function() {

	var debugMode = false;
	var urlModMap = {};
	var currentScriptUrl = "";
	var currentScriptDir = "";
	var currentScriptMod = null;
	var bakeMode = false;
	var bakedSrc = "";
	var totalIncludesToFinalize = 0;
	var modCount = 0;
	var aliasMap = {};
	
	function include(urls, callback)
	{
		var args = validateArgs(urls, callback);
		
		callback = args.callback;
		urls = implyUrls(args.urls, callback);
		
		if(document.currentScript) {
			currentScriptUrl = document.currentScript.src;
			currentScriptDir = currentScriptUrl.split("?")[0];
			currentScriptDir = currentScriptDir.split("/").slice(0, -1).join("/");
			currentScriptMod = getMod(currentScriptUrl);
		}
		
		totalIncludesToFinalize++;
		var urlsToLoad = urls.length;
		var thisIncludeScriptMod = currentScriptMod;
		
		if(urlsToLoad === 0) {
			finalCallback();
		}
		
		for(var i=0; i<urls.length; i++) {
			var url = urls[i] = getFullUrl(urls[i]);
			includeSingle(url, singleCallback);
		}
		
		function singleCallback()
		{
			urlsToLoad--;
			
			if(urlsToLoad === 0) {
				finalCallback();
			}
		}
		
		function finalCallback()
		{
			debugLog("final callback in " + thisIncludeScriptMod.url);
			
			var depMods = [];
		
			for(var i=0; i<urls.length; i++) {
				depMods.push(getMod(urls[i]).data);
			}
			
			totalIncludesToFinalize--;
			
			if(bakeMode) {
				bakedSrc += "mods['" + thisIncludeScriptMod.modId + "'] = ";
				bakedSrc += "(" + callback.toString() + ")(";
				
				for(var i=0; i<urls.length; i++) {
					var depMod = getMod(urls[i]);
					bakedSrc += "mods['" + depMod.modId + "'],";
				}
				
				bakedSrc += ");\n\n";
				
				if(totalIncludesToFinalize === 0) {
					bakeFinished();
				}
			}
			else {
				var data = callback.apply(this, depMods);
			}
			
			thisIncludeScriptMod.data = data;
		}
	}
	
	include.bake = function bake(urls, callback)
	{
		bakeMode = true;
		
		bakedSrc = "";
		bakedSrc += "(function() {\n";
		bakedSrc += "var mods = {};\n";
		
		include(urls, callback);
	};
	
	include.addAlias = function addAlias(alias, url)
	{
		aliasMap[alias] = url;
	};
	
	function bakeFinished()
	{
		bakedSrc += "\n})();";
		console.log(bakedSrc);
		
		bakeMode = false;
	}
	
	function validateArgs(urls, callback)
	{
		if(!Array.isArray(urls)) {
			if(typeof urls === "function") {
				callback = urls;
				urls = [];
			}
			else if(typeof urls === "string") {
				urls = [urls];
			}
			else {
				throw "Parameter 'urls' must be a string or an array.";
			}
		}
		
		if(typeof callback !== "function") {
			if(callback === undefined) {
				callback = noop;
			}
			else {
				throw "Parameter 'callback' must be a function or undefined.";
			}
		}
		
		for(var i=0; i<urls.length; i++) {
			urls[i] = resolveAlias(urls[i]);
		}
		
		return {
			urls: urls,
			callback: callback,
		};
	}
	
	function implyUrls(urls, callback)
	{
		var funcStr = callback.toString();
		var matches = /\((.*)\)/.exec(funcStr);
		var argList = matches[1]
			.split(",")
			.map(function(arg) { return arg.trim(); })
			.filter(function(arg) { return arg !== ""; });
		
		for(var i=urls.length; i<argList.length; i++) {
			var arg = argList[i];

			if(hasAlias(arg)) {
				arg = resolveAlias(arg);
			}
			else {
				arg = "./" + arg.split("_").join("/") + ".js";
			}
			
			urls.push(arg);
		}
		
		return urls;
	}
	
	function hasAlias(query)
	{
		return aliasMap.hasOwnProperty(query);
	}
	
	function resolveAlias(query)
	{
		if(hasAlias(query)) {
			return aliasMap[query];
		}
		else {
			return query;
		}
	}
	
	function includeSingle(url, callback)
	{
		var mod = getMod(url);
		
		if(isModReady(url)) {
			callback();
		}
		else {
			if(isModAdded(url)) {
				mod.readyCallbacks.push(callback);
			}
			else {
				addMod(url, callback);
			}
			
			currentScriptMod.waitingFor.push(mod);
		}
	}
	
	function addMod(url, callback)
	{
		var mod = getMod(url);
		var script = document.createElement("script");
		
		script.src = url;
		script.addEventListener("load", modLoaded);
		document.head.appendChild(script);
		
		mod.added = true;
		mod.readyCallbacks.push(callback);
		
		debugLog(url + " added from " + currentScriptUrl);
		
		function modLoaded()
		{
			debugLog(url + " loaded");
			
			mod.loaded = true;
			
			if(mod.waitingFor.length === 0) {
				setModReady(url);
			}
			else {
				var waitingForCount = mod.waitingFor.length;
				
				for(var i=0; i<mod.waitingFor.length; i++) {
					var dep = mod.waitingFor[i];
					
					if(isModReady(dep.url)) {
						waitingForCount--;
					}
					else {
						dep.readyCallbacks.push(function() {
							waitingForCount--;
							
							if(waitingForCount === 0) {
								setModReady(url);
							}
						});
					}
				}
			}
		}
	}
	
	function setModReady(url)
	{
		var mod = getMod(url);
		
		mod.ready = true;
		
		debugLog(url + " ready");
		
		for(var i=0; i<mod.readyCallbacks.length; i++) {
			mod.readyCallbacks[i]();
		}
	}
	
	function getMod(url)
	{
		if(urlModMap[url] === undefined) {
			urlModMap[url] = {
				added: false, loaded: false, ready: false, data: undefined,
				url: url, waitingFor: [], readyCallbacks: [], modId: "mod" + modCount++
			};
		}
		
		return urlModMap[url];
	}
	
	function isModAdded(url)
	{
		return getMod(url).added;
	}
	
	function isModReady(url)
	{
		return getMod(url).ready;
	}

	function getFullUrl(url)
	{
		var script = document.createElement("script");
		
		if(startsWith(url, "./")) {
			if(currentScriptDir !== "") {
				url = currentScriptDir + url.slice(1);
			}
			else {
				throw "'currentScriptDir' was not defined.";
			}
		}
		
		script.src = url;
		
		return script.src;
	}
	
	function debugLog(msg)
	{
		if(debugMode) {
			console.log(msg);
		}
	}
	
	function arrayRemove(array, elm)
	{
		var index = array.indexOf(elm);

		if(index !== -1) {
			array.splice(index, 1);
		}
	}
	
	function startsWith(str, pref)
	{
		return str.slice(0, pref.length) === pref;
	}
	
	return include;

})();
