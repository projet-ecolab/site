function removeCurrentClass() {
    // Utilisé pour retiré les classes current (utilisées en CSS sur la page active)

    var toDel = ["startCreditsBtn", "startLoginBtn", "startSignupBtn", "logoutBtn"];

    for (var i=0; i<toDel.length; i++) {
        document.getElementById(toDel[i]).classList.remove("current");
    }
}
function printOut(text) {
    // Utilisé pour afficher un message d'erreur
    document.getElementById("messageDisplay").innerHTML = text;
}
function startSession() {
    // Appelé quand la page est chargée
    console.log ('[INFO] Démarrage de la session');
    window.s = new Session("/backend/backend.php");
}
function tryLogin() {
    // Quand l'utilisateur clique "login" dans le formulaire
    console.log("[INFO] Démarrage de la procédure de connexion");
    printOut("LOGGING IN");
    var uname = document.getElementById("username_login_box").value;
    var pw = document.getElementById("password_login_box").value;
    window.s.execute(window.s.login, tryLoginHandler, [uname, pw], false);
    return false;
}
function networkError() {
    window.s.reset_network();
    console.log('[ERREUR] Problème de connexion');
    printOut("Oups, c'est un peu gênant, le serveur a l'air d'être en vacances...");
}
function tryLoginHandler(output) {
    if (output === null) {
        console.log ('[ERREUR] Le mot de passe saisi semble être vide');
        networkError();
    } else {
        document.getElementById("password_login_box").value = ""
        if (output) {
            window.s.execute(window.s.getAccountInfo, tryAccountInfoHandler);
        } else {
            console.log ('[ERREUR] Mot de passe invalide');
            printOut("Bloup bloup... Votre mot de passe est invalide");
        }
    }
}
function tryAccountInfoHandler(output) {
    if (output === null) {
        networkError();
    } else {
        if (output) {
            console.log ('[INFO] Mot de passe bon');
            goodLogin();
        } else {
            // PAS NORMAL !!
            console.log ('[ERREUR] Login refusé');
            printOut("Oh oh... Le serveur vous a refusé le login brutalement, c'est bizarre...");
        }
    }
}
function goodLogin() {
    // Quand le login est bon ce code est exécuté
    console.log ('[INFO] Vous êtes connecté(e)');
    hideAll();
    console.log ('[INFO] Les éléments inutiles sont masqués');
    printOut("");
    console.log ('[INFO] Affichage des boutons approprié');
	
	hide("startLoginBtn");
	hide("startSignupBtn");
    document.getElementById("logoutBtn").style = "";
    
    var accountBtn = document.getElementById("myAccountBtn");
    accountBtn.innerHTML = window.s.username;
    accountBtn.style = "";
    accountBtn.classList.add("current");

    removeCurrentClass();
	
    setProfileDivInfo();
}
function setProfileDivInfo() {
    // On affiche les infos utilisateur dans le truc "mes infos"
    console.log('[INFO] Affichage des informations utilisateur');
    show("account_data_div");
    hide("confirm_edit_account_div");
    hide("delete_account_warning");
    document.getElementById("account_data").innerHTML = "Nom d'utilisateur : <b>"+window.s.username+"</b><br>Adresse Email : <b>"+window.s.email+"</b>";
}
function startEditAccount() {
    // Quand l'utilisateur clique sur "modifier le compte"
    console.log('[INFO] Début de la procédure de modification du compte');
    hide("account_data_div");
    show("confirm_edit_account_div");
    document.getElementById("edit_account_email").value = window.s.email;
    document.getElementById("edit_account_pw").value = window.s.pw;
}
function confirmEditAccount(output) {
    // Quand l'utilisateur clique sur annuler (false) ou confirmer (true) les modifications de son compte
    console.log('[ATTENTION] Veuillez confirmer les modifications de votre compte (action irréversible)');
    var new_email = document.getElementById("edit_account_email").value;
    var new_pw = document.getElementById("edit_account_pw").value;
    if (!output) {
        setProfileDivInfo();
    } else {
        document.getElementById("account_data").innerHTML = "Mise à jour des infos...";
        show("account_data_div");
        hide("confirm_edit_account_div");
        window.s.execute(window.s.editAccount, editAccountHandler, [new_email, new_pw]);
    }
}
function editAccountHandler(output) {
    if (output === null) {
        networkError();
    } else {
        setProfileDivInfo();
        if (output === false) {
            console.log("[ERREUR] Requête illégitime");
            printOut("Ah, il semble que notre serveur n'ait pas trouvé votre requête légitime... On essaye de régler ça au plus vite!")
        }
    }
}
function startDeleteAccount() {
    // Quand l'utilisateur clique sur "Supprimer le compte"
    console.log ('[INFO]  Démarrage de la procédure de suppression du compte');
    hide("account_data_div"); // On cache les infos
    show("delete_account_warning"); //On montre l'avertissement
}
function confirmDeleteAccount(output) {
    // Quand l'utilisateur clique sur "Non, ne pas supprimer" (false) ou "oui, supprimer" (true)
    console.log ('[ATTENTION] Veuillez confirmer votre volonté de supprimer votre compte (action irréversible)');
    if (output) {
        console.log ('[INFO] Suppression du compte confirmée');
        window.s.execute(window.s.deleteAccount, deleteAccountHandler);
    } else {
        console.log ('[INFO] Suppression du compte annulée');
        hide("delete_account_warning");
        show("account_data_div");
    }
}
function deleteAccountHandler(output) {
    hide("delete_account_warning");
    show("account_data_div");
    if (output === null) {
        networkError();
    } else {
        if (output) {
            showThing(3);
        } else {
            console.log ('[ERREUR] Annulation de la suppression du compte à la dernière minute');
            printOut("Aïe... Il semble que l'exécution en place publique de votre compte ait été refusée par notre serveur...");
        }
    }
}
function tryRegister() {
    console.log ('[INFO] Démarrage de la procédure de connexion');
    var uname = document.getElementById("username_register_box").value;
    var email = document.getElementById("email_register_box").value;
    var pw = document.getElementById("pw_register_box").value;
    window.s.execute(window.s.register, tryRegisterHandler, [uname, email, pw], false);
    return false;
}
function tryRegisterHandler(output) {
    document.getElementById("username_register_box").value = "";
    document.getElementById("email_register_box").value = "";
    document.getElementById("pw_register_box").value = "";
    if (output === null) {
        networkError();
    } else {
        if (output) {
            window.s.execute(window.s.getAccountInfo, tryAccountInfoHandler);
        } else {
            console.log ("[ERREUR] Le nom d'utilisateur est déjà pris");
            printOut("Bloup... Apparemment quelqu'un a déjà pris ce nom... Bloup...");
        }
    }
}
function logOut() {
    // Fonction à appeler quand il faut remettre la page à 0 à l'écran de login
    // Pour l'instant on dit d'actualiser la page
    // document.location.reload();
	window.s = null;
	console.log ('[INFO] Déconnexion confirmée');
	startSession();
}
function showThing(thing) {
    hideAll();
    /*Affiche une certaine partie de la page :
     - 0: login
     - 1: register
     - 2: credits
     - 3: accueil ET logout
     - 4: accueil SANS logout
     - 5: recherche données [A FAIRE]
    */
    if (thing === 0) { //Login
        show("loginDiv");
        console.log ('[INFO] Affichage du formulaire de connexion')

        // Classes
        removeCurrentClass();
        document.getElementById("startLoginBtn").classList.add("current");

    } else if (thing === 1) { //Register
        show("signupDiv");
        console.log("[INFO] Affichage du formulaire d'inscription")

        // Classes
        removeCurrentClass();
        document.getElementById("startSignupBtn").classList.add("current");

    } else if (thing === 2) { // Credits
        show("creditsDiv");
        console.log('[INFO] Affichage des crédits')

        // Classes
        removeCurrentClass();
        document.getElementById("startCreditsBtn").classList.add("current");
    } else  if (thing === 3) { //Logout
        logOut(); // On reset la session
        
        // Classes
        removeCurrentClass();
        document.getElementById("homeBtn").classList.add("current");
        
        document.getElementById("startLoginBtn").style = "";
        document.getElementById("startSignupBtn").style = "";
        hide("logoutBtn");

        hideAll();

        show("discoverDiv");
        show("mapContainerDiv");
        show("dlDiv");

        hide("logoutBtn");
        hide("myAccountBtn");
        document.getElementById("myAccountBtn").innerHTML = "MON COMPTE";
	} else if (thing === 4) { //Accueil
        removeCurrentClass();
        document.getElementById("homeBtn").classList.add("current");
        hideAll();

        show("discoverDiv");
        show("mapContainerDiv");
        show("dlDiv");
    } else  if (thing === 5) { // Clic sur compte
        hideAll();

        removeCurrentClass();
        document.getElementById("myAccountBtn").classList.add("current");

        show("monProfilMenuDiv");
    } else if (thing === 6) { // Faire une recherche
        hideAll();

        removeCurrentClass();
        document.getElementById("startDataBtn").classList.add("current");
    } else {};
}
function show (id) {
    document.getElementById(id).style = "display:block";
}
function hide (id) {
    document.getElementById(id).style = "display:none";
}
function hideAll() {
    console.log("[INFO] Masquage de tous les éléments de la page")
    hide("loginDiv");
    hide("signupDiv");
    hide("discoverDiv");
    hide("monProfilMenuDiv");
    hide("dlDiv");
    hide("mapContainerDiv");
    hide("creditsDiv");
	
	//show("menuDiv");
}