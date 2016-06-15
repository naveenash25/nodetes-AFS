var express = require('express');
var router = express.Router();
var swapi = require('swapi-node');
var async = require('async');

router.get('/', function(req, res, next) {
	res.render('index',{title: "AFS test"})
});

router.get('/character/:name', function(req, res, next) {
	var name = req.params.name;
	getNewData(res, 'http://swapi.co/api/people/', name, function(data){
		res.render('name', data);
	});
});

router.get('/planetresidents', function(req, res, next) {
	swapi.get('http://swapi.co/api/planets/').then(function (result) {
		var planet = {};
		async.eachSeries(result.results, function(eachData, callback){
			getPeople(eachData.residents, function(residentsData){
				planet[eachData.name] = residentsData;	
				callback();
			});
		  }, function(err){
			  res.send(planet);
		  }
		);
	});	
});

router.get('/characters', function(req, res, next) {
	var sortBy = req.query.sort
	getPeopleData('http://swapi.co/api/people/',[],function(peoplesData){
		if(req.query.sort){
			peoplesData = sortByKey(peoplesData, sortBy);
		}
		res.send(peoplesData);
	});
});

function getNewData(res, url, name, callback1){
	swapi.get(url).then(function (result) {
		var next = result.next;
		var data = result.results;
		var finalData;
		async.eachSeries(data, function(eachData, callback){
			var rgxp = new RegExp(name, "gi");
			if(eachData.name.match(rgxp)){
				finalData = eachData;
			}
			callback();
		  }, function(err){
			  if(finalData){
				callback1(finalData);
			  }else{
				  if(next){
					  getNewData(res, next, name, callback1);
				  }else{
					  res.send("data not found");
				  }  
			  }	
		  }
		);
	});
}

function getPeople(residents, callback1){
	var people = [];
	async.eachSeries(residents, function(eachUrl, callback){
		swapi.get(eachUrl).then(function (result) {
			people.push(result.name);
			callback();
		});
	  }, function(err){
		 callback1(people);
	  }
	);
}

function getPeopleData(url, peoplesData, callback){
	swapi.get('http://swapi.co/api/people/').then(function (result) {
		 peoplesData = peoplesData.concat(result.results);
		console.log(peoplesData.length);
		if(peoplesData.length < 50){
			getPeopleData(result.next, peoplesData, callback)
		}else{
			callback(peoplesData);
		}
	});
}

function sortByKey(array, key) {
    return array.sort(function(a, b) {
        var x = a[key]; var y = b[key];
        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    });
}

module.exports = router;
