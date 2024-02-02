document.addEventListener('DOMContentLoaded', function() {
    let userId = new URLSearchParams(window.location.search).get('user_id');
    console.log(userId)
    let clientId = '1195885802786394154';
    let redirectUri = 'https://doginal-dogs-verification-2cc9b2edc81a.herokuapp.com/callback'
    let oauthSuccess = new URLSearchParams(window.location.search).get('oauth_success') === 'True';

    const loginDiscordButton = document.getElementById('loginDiscord');
    const loginWalletButton = document.getElementById('loginWallet'); 
    const logoutDiscordButton = document.getElementById('logoutDiscord');
    
    if (logoutDiscordButton) {
        logoutDiscordButton.addEventListener('click', function() {
            logoutFromDiscord();
        });
    }

    if (loginDiscordButton) {
        loginDiscordButton.addEventListener('click', function() {
            if (clientId && redirectUri) {
                window.location.href = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=identify`;
            } else {
                console.error("OAuth details are missing.");
                alert("OAuth details are missing.");
            }
        });
    }

    if (oauthSuccess) {
        loginDiscordButton.style.display = 'none';
        logoutDiscordButton.style.display = 'block';
        loginWalletButton.style.display = 'block'; 
    } 

    if (loginWalletButton) {
        loginWalletButton.addEventListener('click', function() {
            // Call signMessageWithDogeLabsWallet function
            if (typeof window.dogeLabs !== 'undefined') {
                signMessageWithDogeLabsWallet(userId);
            } else {
                alert("Please install the DogeLabs Wallet extension.");
            }
        });
    }
}); 

function logoutFromDiscord() { 
    sessionStorage.removeItem('discordToken');
    // or localStorage.removeItem('discordToken');

    // Update UI to reflect logged out state
    document.getElementById('loginDiscord').style.display = 'block';
    document.getElementById('loginWallet').style.display = 'none';
    document.getElementById('logoutDiscord').style.display = 'none'; 
    alert('You have been logged out from Discord.');
}

function getDoginals(userId) {
    window.dogeLabs.getInscriptions()
        .then(inscriptions => {
            console.log("Inscriptions:", inscriptions);

            if (inscriptions.list.length === 0) {
                // No inscriptions found, show the updated alert message
                alert('Sorry, you have no Doginal Dogs in your wallet! Adopt a dog, come back, and try again!');
                return;
            }

            // Extract required details from each inscription
            const inscriptionData = inscriptions.list.map(inscription => ({
                user_id: userId,
                inscriptionNumber: inscription.inscriptionNumber,
                address: inscription.address 
            }));

            // Send the extracted data back to your server 
            fetch('https://doginal-dogs-verification-2cc9b2edc81a.herokuapp.com/verify_holder', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ optimized_data: inscriptionData, user_id: userId })
            })
            .then(response => response.json())
            .then(data => {  
                console.log(data);
                if (data && data.length > 0) {
                    data.forEach(responseItem => {
                        if (responseItem.message) {
                            alert(responseItem.message);
                        } else if (responseItem.error) {
                            alert(responseItem.error);
                        }
                    });
                } else {
                    alert('Unexpected response format from server.');
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });
        })
        .catch(error => {
            console.error("Error fetching inscriptions:", error.message);
        }); 
}

function signMessageWithDogeLabsWallet(userId) {
    if (typeof window.dogeLabs !== 'undefined') {
        window.dogeLabs.requestAccounts()
            .then(accounts => { 
                const messageToSign = "Sign to Prove Ownership";
                const messageType = "text";

                window.dogeLabs.signMessage(messageToSign, messageType)
                    .then(signature => {
                        console.log("Message Signature:", signature);
                        // Rest of your logic
                        fetch('https://doginal-dogs-verification-2cc9b2edc81a.herokuapp.com/verify_signature', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ signature: signature, user_id: userId })
                        })
                        .then(response => response.json())
                        .then(data => {
                            console.log(data);
                            getDoginals(userId); 
                        })
                        .catch(error => {
                            console.error('Error:', error);
                        });
                    })
                    .catch(error => {
                        console.error("Error signing message:", error.message);
                    });
            })
            .catch(error => {
                console.error("Error getting accounts:", error.message);
            });
    } else {
        alert("Please install the DogeLabs Wallet extension.");
    }
}