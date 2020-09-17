<?php
/*
Fichier backend de l'appli Ecolab du club sciences au Collège Louis Pasteur (Noyon).
Quelques paramètres peuvent être changés pour modifier le fonctionnement interne du backend.
Par Romain Viton
*/

$GLOBALS["user_db"] = "users.txt"; //Fichier de stockage des utilisateurs
$GLOBALS["records_db"] = "records.txt"; //Fichier de stokage des enregistrements
$GLOBALS["places_db"] = "places.txt"; //Ficher de stockage des endroits
$GLOBALS["token_time"] = 30; //Durée (en secondes) d'une session avant de devoir de reconnecter
$GLOBALS["id_limit"] = 4000000000; //Taille de l'espace des ID

function db_encode ($input) {return str_replace(",", "+c", str_replace("+", "+p", $input));}

function db_decode ($input) {return str_replace("+p", "+", str_replace("+c", ",", $input));}

//Une fonction pour vérifier la validité d'un token JSON, renvoie 1 si valide, 0 sinon
function check_token ($json_string) {
	$json_array = json_decode($json_string, true); //On décode la chaîne en tableau
	$user_found = 0;
	$user_data = [];
	foreach (file($GLOBALS["user_db"]) as $line) {
		$fields = explode(",", $line);
		if ($fields[0] == $json_array["id"]) {
			$user_found = 1; //Si les ID marchent, on dit qu'on a trouvé et on arrête
			$user_data = $fields;
		}
		if (($fields[0] == "DELETE") and ($fields[1] == $json_array["id"])) {
			$user_found = 0;
			break;
		}
	}
	if (!$user_found) {return 0;} else { // Si pas d'utilisateur trouvé, invalide
		$salt = $fields[4]; //On récupère le sel de l'utilisateur
		$token = hash("sha256", $json_array["id"].$json_array["exp_time"].$salt); //On recalcule son code de vérification
		if ($token != $json_array["token"]) {return 0;} else { //Si les codes ne sont pas identiques, invalide
			if ($json_array["exp_time"] < time()) {return 0;} else {return 1;} //On vérifie que le token a pas dépassé la date d'expiration
		}
	}
}

$action = $_GET["action"];

// On exécute différentes actions en fonction du type de requête
switch ($_SERVER["REQUEST_METHOD"]) { // $_SERVER["REQUEST_METHOD"] pour le vrai protocole, mais pour débug on met $_GET["p"]
	case "GET": // Obtention de données
		switch ($action) {
			case "register":
				// Enregistrement utilisateur
				$name = $_GET["uname"];
				$email = $_GET["email"];
				$pw = $_GET["pw"];
				$error = 0;
				// On vérifie si y'a pas déjà un utilisateur avec ce nom
				foreach (file($user_db) as $line) {
					$fields = explode(",", $line);
					if ($name == $fields[1]) {$error = 1;}
				}
				$salt = hash("sha256", rand(0, $GLOBALS["id_limit"]));
				$hash = hash("sha256", $salt.$pw);
				$userID = rand(0, $GLOBALS["id_limit"]);
				if ($error) {echo "{}";} else {
					$line = "\n".$userID.",".$name.",".$email.",".$hash.",".$salt.",".time();
					$fileObj = fopen($user_db, "a");
					fwrite($fileObj, $line);
					fclose($fileObj);
					$expiration = time()+$token_time;
					$json_array = [];
					$json_array["id"] = $userID;
					$json_array["exp_time"] = $expiration;
					$json_array["token"] = hash("sha256", $userID.$expiration.$salt);
					$out = json_encode($json_array);
					echo $out; // On revoie le token
				}
				break;
			case "login":
				// Connection utilisateur
				$uname = $_GET["uname"];
				$pw = urldecode($_GET["pw"]);
				$user_found = 0;
				$user_data = [];
				
				foreach (file($user_db) as $line) {
					$fields = explode(",", $line);
					if ($fields[1] == $uname) {
						$user_found = 1;
						$user_data = $fields;
					}
					if (($fields[0] == "DELETE") and ($fields[2] == $uname)) {
						$user_found = 0;
						break;
					}
				}
				
				if (!$user_found) {echo "{}";} else {
					$id = $user_data[0];
					$hash = $user_data[3];
					$salt = $user_data[4];
					
					if (hash("sha256", $salt.$pw) != $hash) {echo "{}";} else {
						$expiration = time() + $token_time;
						$token = hash("sha256", $id.$expiration.$salt);
						$a = [];
						$a["id"] = $id;
						$a["exp_time"] = $expiration;
						$a["token"] = $token;
						$out = json_encode($a);
						echo $out;
					}
				}
				break;
			case "account":
				// Demande infos compte
				if (!check_token($_GET["token"])) {echo "{}";} else {
					$id = json_decode($_GET["token"], true)["id"];
					$user_found = 0;
					foreach (file($user_db) as $line) {
						$fields = explode(",", $line);
						if ($fields[0] == $id) {
							$user_found = 1;
						}
					}
					if (!$user_found) {echo "{}";} else {
						$json_array = [];
						$json_array["id"] = $fields[0];
						$json_array["name"] = $fields[1];
						$json_array["email"] = $fields[2];
						$json_array["joined"] = $fields[5];
						$out = json_encode($json_array);
						echo $out;
					}
				}
				break;
			case "records":
				// Demande un enregistrement
				$id = $_GET["id"];
				$record_found = 0;
				$record = [];
				foreach (file($records_db) as $line) {
					$fields = explode(",", $line);
					if ($fields[0] == $id) {
						$record_found = 1;
						$record = $fields;
					}
					if (($fields[0] === "DELETE") and ($fields[1] == $id)) {
						$record_found = 0;
						break;
					}
				}
				if (!$record_found) {echo "{}";} else {
						$json_array = [];
						$json_array["id"] = $record[0];
						$json_array["user_id"] = $record[1];
						$json_array["ville"] = $record[2];
						$json_array["longitude"] = floatval($record[3]);
						$json_array["latitude"] = floatval($record[4]);
						$json_array["timestamp"] = intval($record[5]);
						$json_array["qual_air"] = json_decode(db_decode($record[6]), true);
						$json_array["qual_eau"] = json_decode(db_decode($record[7]), true);
						$json_array["place_id"] = $record[8];
						$out = json_encode($json_array);
						echo $out;
					} 
				break;
			case "query":
				// Demande une recherche dans les enregistrements
				$filter = $_GET["filter"];
				$value = $_GET["value"];
				switch ($filter) {
					case "user_id":
						$records_found = 0;
						$record_ids_found = [];
						foreach (file($records_db) as $line) {
							$fields = explode(",", $line);
							if ($fields[1] == $value) {
								array_push($record_ids_found, $fields[0]);
								$records_found++;
							}
						}
						$json_array = [];
						$json_array["count"] = $records_found;
						$json_array["ids"] = $record_ids_found;
						$out = json_encode($json_array);
						echo $out;
						break;
					case "ville":
						$records_found = 0;
						$record_ids_found = [];
						foreach (file($records_db) as $line) {
							$fields = explode(",", $line);
							if ($fields[2] == $value) {
								array_push($record_ids_found, $fields[0]);
								$records_found++;
							}
						}
						$json_array = [];
						$json_array["count"] = $records_found;
						$json_array["ids"] = $record_ids_found;
						$out = json_encode($json_array);
						echo $out;
						break;
					case "place_id":
						$records_found = 0;
						$record_ids_found = [];
						foreach (file($records_db) as $line) {
							$fields = explode(",", $line);
							if ($fields[8] == $value) {
								array_push($record_ids_found, $fields[0]);
								$records_found++;
							}
						}
						$json_array = [];
						$json_array["count"] = $records_found;
						$json_array["ids"] = $record_ids_found;
						$out = json_encode($json_array);
						echo $out;
						break;
				}
				break;
			case "user_search":
				// Infos sur utilisateur
				$user_found = 0;
				$user_deleted = 0;
				$user_data = [];
				foreach (file($user_db) as $line) {
					$fields = explode(",", $line);
					switch ($_GET["filter"]) {
						case "name":
							if ($fields[1] == $_GET["value"]) {
								$user_found = 1;
								$user_data = $fields;
							}
							if (($fields[0] == "DELETE") and ($fields[2] == $_GET["value"])) {
								$user_found = 0;
								$user_deleted = 1;
								break 2; // exit case AND foreach
							}
							break;
						case "id":
							if ($fields[0] == $_GET["value"]) {
								$user_found = 1;
								$user_data = $fields;
							}
							if (($fields[0] == "DELETE") and ($fields[1] == $_GET["value"])) {
								$user_found = 0;
								$user_deleted = 1;
								break 2; // exit case AND foreach
							}
							break;
					}
				}
				if (!$user_found) {
					echo "{}";
				} else {
					$a = [];
					$a["id"] = $user_data[0];
					$a["name"] = $user_data[1];
					$a["joined"] = $user_data[5];
					$out = json_encode($a);
					echo $out;
				}
				break;
			case "places":
				// Recherche de lieux
				$filter = $_GET["filter"];
				$value = $_GET["value"];
				$places_found = [];
				foreach (file($places_db) as $line) {
					$fields = explode(",", $line);
					$a = [];
					$a["id"] = $fields[0];
					$a["user_id"] = $fields[1];
					$a["name"] = $fields[2];
					$a["ville"] = $fields[3];
					$a["longitude"] = $fields[4];
					$a["latitude"] = $fields[5];
					$a["timestamp"] = $fields[6];
					switch ($filter) {
						case "ville":
							if ($a["ville"] == $value) {
								array_push($places_found, $a);
							}
							break;
						case "user_id":
							if ($a["user_id"] == $value) {
								array_push($places_found, $a);
							}
							break;
					}
				}
				$out = json_encode($places_found);
				echo $out;
				break;
		}
		break;
	case "POST": // Ajout de données
		switch ($action) {
			case "records":
				// Ajout d'un enregistrement de la qualité air/eau
				if (!check_token($_GET["token"])) {echo "{}";} else {
/* 					$json_array = json_decode(urldecode($_GET["new"]), true);
					$json_array["id"] = rand(0, $GLOBAL["id_limit"]);
					$json_array["user_id"] = json_decode($_GET["token"], true)["id"];
					$json_array["ville"] = get_city_name($json_array["latitude"], $json_array["longitude"]);
					$line = "\n".$json_array["id"].",".$json_array["user_id"].",".$json_array["ville"].",".$json_array["longitude"].",".$json_array["latitude"].",".$json_array["timestamp"].",".$json_array["qual_air"].",".$json_array["qual_eau"];
					$fileObj = fopen($records_db, "a");
					fwrite($fileObj, $line);
					fclose($fileObj);
					$out = json_encode($json_array);
					echo $out; */
					
					$input = json_decode(urldecode($_GET["new"]), true);
					$a = [];
					$a["id"] = rand(0, $GLOBALS["id_limit"]);
					$a["user_id"] = json_decode($_GET["token"], true)["id"];
					$a["ville"] = $input["ville"];
					$a["longitude"] = $input["longitude"];
					$a["latitude"] = $input["latitude"];
					$a["timestamp"] = $input["timestamp"];
					$a["qual_air"] = db_encode(json_encode($input["qual_air"]));
					$a["qual_eau"] = db_encode(json_encode($input["qual_eau"]));
					$a["place_id"] = $input["place_id"];
					$line = "\n".$a["id"].",".$a["user_id"].",".$a["ville"].",".$a["longitude"].",".$a["latitude"].",".$a["timestamp"].",".$a["qual_air"].",".$a["qual_eau"].",".$a["place_id"];
					$a["qual_air"] = json_decode(db_decode($a["qual_air"]), true);
					$a["qual_eau"] = json_decode(db_decode($a["qual_eau"]), true);
					
					$fileObj = fopen($records_db, "a");
					fwrite($fileObj, $line);
					fclose($fileObj);
					$out = json_encode($a);
					echo $out;
				}
				break;
			case "places": //Ajout d'endroit
				if (!check_token($_GET["token"])) {echo "{}";} else {
					$new = json_decode($_GET["new"], true);
					$a = [];
					$a["id"] = rand(0, $GLOBALS["id_limit"]);
					$a["user_id"] = json_decode($_GET["token"], true)["id"];
					$a["ville"] = $new["ville"];
					$a["timestamp"] = $new["timestamp"];
					$a["longitude"] = $new["longitude"];
					$a["latitude"] = $new["latitude"];
					$a["name"] = $new["name"];
					$line = "\n".$a["id"].",".$a["user_id"].",".$a["name"].",".$a["ville"].",".$a["longitude"].",".$a["latitude"].",".$a["timestamp"];
					
					$fileObj = fopen($places_db, "a");
					fwrite($fileObj, $line);
					fclose($fileObj);
					
					$out = json_encode($a);
					echo $out;
					}
				break;
		}
		break;
	case "PATCH": // Mise à jour de données
		if (!check_token($_GET["token"])) {echo "{}";} else  {
			switch ($action) {
				case "account":
					// Mise à jour des infos utilisateur
					$json_array = json_decode(urldecode($_GET["new"]), true);
					$id = json_decode($_GET["token"], true)["id"];
					$user_data = [];
					foreach (file($user_db) as $line) {
						$fields = explode(",", $line);
						if ($fields[0] == $id) {
							$user_data = $fields;
						}
					}
					$pw_changed = 0;
					if (isset($json_array["pw"])) {
						$pw = $json_array["pw"];
						$pw_changed = 1;
					}
					if (isset($json_array["email"])) {
						$email = $json_array["email"];
					} else {
						$email = $user_data[2];
					}
					$uname = $user_data[1];
					$joined = $user_data[5];
					$salt = $user_data[4];
					if ($pw_changed) {
						$hash = hash("sha256", $salt.$pw);
					} else {
						$hash = $user_data[3];
					}
					$line = "\n".$id.",".$uname.",".$email.",".$hash.",".$salt.",".$joined;
					$fileObj = fopen($user_db, "a");
					fwrite($fileObj, $line);
					fclose($fileObj);
					$json_array = [];
					$json_array["id"] = $id;
					$json_array["name"] = $uname;
					$json_array["email"] = $email;
					$json_array["joined"] = $joined;
					$out = json_encode($json_array);
					echo $out;
					break;
				case "records":
					// Mise à jour d'un enregistrement
					$user_id = json_decode($_GET["token"], true)["id"];
					$new_record = json_decode(urldecode($_GET["new"]), true);
					$record_found = 0;
					$old_record = [];
					foreach (file($records_db) as $line) {
						$fields = explode(",", $line);
						if ($fields[0] == $new_record["id"]) {
							$record_found = 1;
							$old_record = $fields;
						}
						if (($fields[0] == "DELETE") and ($fields[1] == $new_record["id"])) {
							$record_found = 0;
							break;
						}
					}
					if (!$record_found) {echo "{}";} else {
						if (!isset($new_record["ville"])) {$new_record["ville"] = $old_record[2];}
						if (!isset($new_record["longitude"])) {$new_record["longitude"] = $old_record[3];}
						if (!isset($new_record["latitude"])) {$new_record["latitude"] = $old_record[4];}
						if (!isset($new_record["timestamp"])) {$new_record["timestamp"] = $old_record[5];}
						if (!isset($new_record["qual_air"])) {$new_record["qual_air"] = json_decode(db_decode($old_record[6]), true);}
						if (!isset($new_record["qual_eau"])) {$new_record["qual_eau"] = json_decode(db_decode($old_record[7]), true);}
						$new_record["user_id"] = $old_record[1];
						if ($new_record["user_id"] == json_decode($_GET["token"], true)["id"]) {
							$out = json_encode($new_record);
							echo $out;
							$line = "\n".$new_record["id"].",".$new_record["user_id"].",".$new_record["ville"].",".$new_record["longitude"].",".$new_record["latitude"].",".$new_record["timestamp"].",".db_encode(json_encode($new_record["qual_air"])).",".db_encode(json_encode($new_record["qual_eau"]));
							$fileObj = fopen($records_db, "a");
							fwrite($fileObj, $line);
							fclose($fileObj);
						} else {echo "{}";}
					}
					break;
			}
		}
		break;
	case "DELETE": // Suppression de données
		$success = 0;
		if (check_token($_GET["token"])) {
			switch ($action) {
				case "account":
					// Suppression d'un compte
					$id = json_decode($_GET["token"], true)["id"];
					foreach (file($user_db) as $line) {
						$fields = explode(",", $line);
						if ($fields[0] == $id) {
							$uname = $fields[1];
							break;
						}
					}
					$line = "\nDELETE,".$id.",".$uname;
					$fileObj = fopen($user_db, "a");
					fwrite($fileObj, $line);
					fclose($fileObj);
					$success = 1;
					break;
				case "records":
					// Suppression d'un enregistrement
					$user_id = json_decode($_GET["token"], true)["id"];
					$record_id = $_GET["id"];
					$record_found = 0;
					$record = [];
					foreach (file($records_db) as $line) {
						$fields = explode(",", $line);
						if ($fields[0] == $record_id) {
							$record = $fields;
							$record_found = 1;
						}
						if (($fields[0] == "DELETE") and ($fields[1] == $record_id)) {
							$record_found = 0;
							break;
						}
					}
					if (!$record_found) {$success = 0;} else {
						if ($user_id != $record[1]) {$success = 0;} else {
							$line = "\nDELETE,".$record_id;
							$fileObj = fopen($records_db, "a");
							fwrite($fileObj, $line);
							fclose($fileObj);
							$success = 1;
						}
					}
					break;
			}
		}
		$array = [];
		if ($success) {
			$array["success"] = true;
		} else {
			$array["success"] = false;
		}
		$out = json_encode($array);
		echo $out;
		break;
}








?>