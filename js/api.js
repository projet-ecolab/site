//Code de l'API Ecolab

class Place {
	constructor(id=null, user_id=null, name=null, ville=null, longitude=null, latitude=null, timestamp=null) {
		this.id = id;
		this.user_id = id;
		this.name = name;
		this.ville = ville;
		this.longitude = longitude;
		this.latitude = latitude;
		this.timestamp = timestamp;
	}
}

class Record {
	constructor(id=null, user_id=null, longitude=null, latitude=null, ville=null, timestamp=null, qual_air=null, qual_eau=null, place_id=null) {
		this.id = id;
		this.user_id = user_id;
		this.ville = ville;
		this.longitude = longitude;
		this.latitude = latitude;
		this.timestamp = timestamp;
		this.qual_air = qual_air;
		this.qual_eau = qual_eau;
		this.place_id = place_id;
	}
}

class Measure {
	constructor(value, unit) {
		this.value = value;
		this.unit = unit;
	}
}

class AirQuality {
	constructor(part_fines, taux_CO, temperature, humidite, taux_CH4) {
		this.part_fines = part_fines;
		this.taux_CO = taux_CO;
		this.temperature = temperature;
		this.humidite = humidite;
		this.taux_CH4 = taux_CH4;
	}
}

class WaterQuality {
	constructor(durete_carbonates, durete_totale, pH, taux_nitrates, taux_nitrites, taux_fer, taux_chlorure) {
		this.durete_carbonates = durete_carbonates;
		this.durete_totale = durete_totale;
		this.pH = pH;
		this.taux_nitrates = taux_nitrates;
		this.taux_nitrites = taux_nitrites;
		this.taux_fer = taux_fer;
		this.taux_chlorure = taux_chlorure;
	}
}

class Session {
	constructor(address, maxRetries=10) {
		this.address = address;
		this.loggedin = false;
		this.hasAccountInfo = false;
		this.serverReachable = false;
		this.unreachableTries = 0;
		this.maxRetries = maxRetries;
		//On rend accessibles les fonctions
		
		this.getAccountInfo = function(callback) {
			if (window.s.loggedIn) {
				var end = "?action=account&token=" + window.s.token;
				var handler = window.s._accountInfoHandler;
				window.s.makeRequest("GET", end, handler, callback);
			} else {
				console.log("[API]: tentative d'appeler getAccountInfo() sans token!");
			}
		};
		
		this.login = function(username, pw, callback) {
			window.s.username = username;
			window.s.pw = pw;
			var end = "?action=login&uname=" + username + "&pw=" + encodeURI(pw);
			var handler = window.s._loginHandler;
			window.s.makeRequest("GET", end, handler, callback);
		}
		
		
		this.register = function(username, email, pw, callback) {
			var end = "?action=register&uname=" + username + "&email=" + email + "&pw=" + encodeURI(pw);
			var handler = window.s._registerHandler;
			window.s.makeRequest("GET", end, handler, callback);
		};
		
		this.refresh_token = function(callback) {
			if (!window.s.loggedIn) {
				console.log("[API]: tentative d'appeler refresh_token() sans token!");
			} else {
				window.s.login(window.s.username, window.s.pw, callback);
			}
		};
		
		this.getRecord = function(id, callback) {
			var end = "?action=records&id=" + id;
			var handler = window.s._getRecordHandler;
			window.s.makeRequest("GET", end, handler, callback);
		};
		
		this.queryRecords = function(filter, value, callback) {
			var end = "?action=query&filter=" + filter + "&value=" + encodeURI(value);
			var handler = window.s._queryRecordsHandler;
			window.s.makeRequest("GET", end, handler, callback);
		};
		
		this.editAccount = function(email=null, pw=null, callback) {
			if (!window.s.hasAccountInfo) {
				console.log("[API]: impossible de modifier les infos du compte sans connection!");
			} else {
				if (email===null) {email=window.s.email;}
				if (pw===null) {pw=window.s.pw}
				var id = window.s.id;
				var name = window.s.username;
				var new_data = {id: id, name: name, email: email, pw: pw};
				var end = "?action=account&token="+window.s.token+"&new="+encodeURI(JSON.stringify(new_data));
				var handler = window.s._editAccountHandler;
				window.s.new_pw = pw;
				window.s.makeRequest("PATCH", end, handler, callback);			
			}
		};
		
		this.editRecord = function(new_record, callback) {
			if (!window.s.loggedIn) {
				console.log("[API]: tentative d'appeler editRecord() sans token!");
			} else {
				var end = "?action=records&token="+window.s.token+"&new="+encodeURI(JSON.stringify(new_record));
				var handler = window.s._editRecordHandler;
				window.s.makeRequest("PATCH", end, handler, callback);
			}
		};
		
		this.postRecord = function(record, callback) {
			if (!window.s.loggedIn) {
				console.log("[API]: tentative d'appeler postRecord() sans token!");
			} else {
				var end = "?action=records&token="+window.s.token+"&new="+encodeURI(JSON.stringify(record));
				var handler = window.s._postRecordHandler;
				window.s.makeRequest("POST", end, handler, callback);
			}
		};
		
		this.deleteAccount = function(callback) {
			if (!window.s.loggedIn) {
				console.log("[API]: tentative de supprimer le compte sans token!");
			} else {
				var end = "?action=account&token="+encodeURI(window.s.token);
				var handler = window.s._deleteAccountHandler;
				window.s.makeRequest("DELETE", end, handler, callback);
			}
		};
		
		this.deleteRecord = function(id, callback) {
			if (!window.s.loggedIn) {
				console.log("[API]: tentative d'appeler deleteRecord() sans token!");
			} else {
				var end = "?action=records&token="+window.s.token+"&id="+id;
				var handler = window.s._deleteRecordHandler;
				window.s.makeRequest("DELETE", end, handler, function(resp){callback(id)});
			}
		};
		
		this.logout = function(callback) {
			window.s.loggedIn = false;
			window.s.hasAccountInfo = false;
			callback();
		};
		
		this.valid_token = function() {
			if (window.s.loggedIn) {
				var now = Date.now() / 1000; //Date.now() revoie le nombre de millisecondes en unix, on ajuste
				if (now+20 > window.s.token_expires) {
					return false;
				} else {
					return true;
				}
			} else {
				return false;
			}
		};
		
		this.execute = function (action, callback, args=[], auto_refresh_token=true) {
			var doCall = true;
			if (auto_refresh_token) {
				if ((window.s.loggedIn)&&(!window.s.valid_token())) {
					doCall = false;
					window.s.execute(window.s.refresh_token, function(output){
						if (output != null) {
							if (output) {
								window.s.execute(action, callback, args, auto_refresh_token);
							} else {
								console.log("[API]: execute() appelé avec token valide obligatoire, mais refus de connection de la part du serveur.");
							}
						}
					}, [], false); //On dit que pas besoin de token pour éviter une récursion infinie
				}
			}
			
			if (window.s.unreachableTries > window.s.maxRetries) {
				console.log("[API]: execute() a dépassé la limite maximale de demandes, renvoi au callback. Utilisez reset_network() pour débloquer les demandes.");
				doCall = false;
				callback(null);
			}
			if (doCall) {
				if (args.length == 0) {
					action(function(output) {
						if ((output == null) && (!window.s.serverReachable)) {
							window.s.execute(action, callback);
						} else {
							callback(output);
						}
					})};
				if (args.length == 1) {
					action(args[0], function(output) {
						if ((output == null) && (!window.s.serverReachable)) {
							window.s.execute(action, callback, args);
						} else {
							callback(output);
						}
					})};
				if (args.length == 2) {
					action(args[0], args[1], function(output) {
						if ((output == null) && (!window.s.serverReachable)) {
							window.s.execute(action, callback, args);
						} else {
							callback(output);
						}
					})};
				if (args.length == 3) {
					action(args[0], args[1], args[2], function(output) {
						if ((output == null) && (!window.s.serverReachable)) {
							window.s.execute(action, callback, args);
						} else {
							callback(output);
						}
					})};
				}
		};
		
		this.reset_network = function() {
			window.s.serverReachable = false;
			window.s.unreachableTries = 0;
		};
		
		this.searchUser = function(filter, value, callback) {
			var end = "?action=user_search&filter="+filter+"&value="+value;
			var handler = window.s._searchUserHandler;
			window.s.makeRequest("GET", end, handler, callback)
		};
		
		this.getPlaces = function(filter, value, callback) {
			var end = "?action=places&filter="+filter+"&value="+value;
			var handler = window.s._getPlacesHandler;
			window.s.makeRequest("GET", end, handler, callback);
		};
		
		this.addPlace = function(place, callback) {
			if (!window.s.loggedIn) {
				console.log("[API]: tentative d'appeler addPlace() sans token!");
			} else {
				var end = "?action=places&token="+window.s.token+"&new="+JSON.stringify(place);
				var handler = window.s._addPlaceHandler;
				window.s.makeRequest("POST", end, handler, callback);
			}
		};
	}
	
	makeRequest(method, ending, handler, callback) {
		var xmlHttp = new XMLHttpRequest();
		xmlHttp.onreadystatechange = function() { 
			if (xmlHttp.readyState == 4) {
				if (xmlHttp.status == 200) {
					window.s.serverReachable = true;
					window.s.unreachableTries = 0;
					handler(xmlHttp.responseText, callback);
				} else {
					window.s.serverReachable = false;
					window.s.unreachableTries++;
					callback(null);
				}
			}
		}
		xmlHttp.open(method, window.s.address+ending, true); // true for asynchronous 
		xmlHttp.send(null);
	}
	
	_loginHandler(output, callback) {
		if (output === "{}") {
			console.log("[API]: réponse négative du serveur pour login(), mauvais identifiants.");
			callback(false);
		} else {
			console.log("[API]: token obtenu à partir du serveur!");
			window.s.token = output;
			window.s.loggedIn = true;
			window.s.token_expires = JSON.parse(output).exp_time;
			callback(true);
		}
	}
	
	
	_accountInfoHandler(output, callback) {
		if (output === "{}") {
			console.log("[API]: réponse négative du serveur pour getAccountInfo(), on essaye de refaire un token...");
			callback(false);
		} else {
			var json = JSON.parse(output);
			window.s.username = json.name;
			window.s.email = json.email;
			window.s.joined = json.joined;
			window.s.id = json.id;
			window.s.hasAccountInfo = true;
			console.log("[API]: les infos utilisateur ont bien été obtenues, on appelle le callback.");
			callback(true);
		}
	}
	
	_registerHandler(output, callback) {
		if (output === "{}") {
			console.log("[API]: échec de l'enregistrement de l'utilisateur");
			callback(false);
		} else {
			window.s.token = output;
			window.s.loggedIn = true;
			console.log("[API]: enregistrement bien fait!");
			callback(true);
		}
	}
	
	_getRecordHandler(output, callback) {
		if (output === "{}") {
			console.log("[API]: une requêtre getRecord() a échoué.");
			callback(false);
		} else {
			var record = JSON.parse(output);
			callback(record);
		}
	}
	
	_queryRecordsHandler(output, callback) {
		if (output === "{}") {
			console.log("[API]: échec d'une recherche dans les enregistrements");
			callback(false);
		} else {
			var results = JSON.parse(output);
			callback(results);
		}
	}
	
	_postRecordHandler(output, callback) {
		if (output === "{}") {
			console.log("[API]: le serveur a refusé l'ajout de l'enregistrement");
			callback(false);
		} else {
			var record = JSON.parse(output);
			callback(record);
		}
	}
	
	_editAccountHandler(output, callback) {
		if (output === "{}") {
			console.log("[API]: la requête de modification de compte a été refusée par le serveur.");
			callback(false);
		} else {
			console.log("[API]: le compte a bien été modifié.");
			var json = JSON.parse(output);
			window.s.email = json.email;
			window.s.pw = window.s.new_pw;
			callback(true);
		}
	}
	
	_editRecordHandler(output, callback) {
		if (output === "{}") {
			console.log("[API]: modification de l'enregistrement refusée par le serveur");
			callback(null);
		} else {
			callback(JSON.parse(output));
		}
	}
	
	_deleteAccountHandler(output, callback) {
		if (JSON.parse(output).success) {
			console.log("[API]: compte supprimé avec succès");
			window.s.loggedIn = false;
			window.s.hasAccountInfo = false;
			callback(true);
		} else {
			console.log("[API]: suppression du compte refusée par le serveur")
			callback(false);
		}
	}
	
	_deleteRecordHandler(output, callback) {
		if (!JSON.parse(output).success) {
			console.log("[API]: suppression d'un enregistrement refusée par le serveur")
			callback(false);
		} else {
			callback(true)
		}
	}
	
	_searchUserHandler(output, callback) {
		if (output === "{}") {
			console.log("[API]: pas de résultat pour l'utilisateur demandé!");
			callback(false);
		} else {
			callback(JSON.parse(output));
		}
	}
	
	_getPlacesHandler(output, callback) {
		if (output === "{}") {
			console.log("[API]: Erreur côté serveur avec getPlaces() !");
			callback(false);
		} else {
			callback(JSON.parse(output))
		}
	}
	
	_addPlaceHandler(output, callback) {
		if (output === "{}") {
			console.log("[API]: ajout d'endroit refusé par le serveur!");
			callback(false);
		} else {
			callback(JSON.parse(output))
		}
	}
}