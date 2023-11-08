
// Demo 10 Step 1.2 - Reading the user data from Firestore and populating the form
var currentUser;               //points to the document of the user who is logged in
function populateUserInfo() {
      firebase.auth().onAuthStateChanged(user => {
            // Check if user is signed in:
            if (user) {

                  //go to the correct user document by referencing to the user uid
                  currentUser = db.collection("users").doc(user.uid)
                  //get the document for current user.
                  currentUser.get()
                        .then(userDoc => {
                              //get the data fields of the user
                              var name = userDoc.data().name;
                              var username = userDoc.data().userName;
                              var email = userDoc.data().userEmail;
                              var birthdate = userDoc.data().userBirthDate;
                              var address = userDoc.data().userAddress;
                              var city = userDoc.data().userCity;
                              var province = userDoc.data().userProvince;
                              var country = userDoc.data().userCountry;

                              // var level = userDoc.data().level;
                              // var preference = userDoc.data().preference;
                              // var points_earned = userDoc.data().points_earned;
                              // var accepted_quests = userDoc.data().accepted_quests;
                              // var completed_quests = userDoc.data().completed_quests_quests;

                              //if the data fields are not empty, then write them in to the form.



                              if (name != null) {
                                    document.getElementById("name").value = name;
                              }
                              if (userName != null) {
                                    document.getElementById("userName").value = username;
                              }
                              if (userEmail != null) {
                                    document.getElementById("userEmail").value = email;
                              }

                              if (userBirthDate != null) {
                                    document.getElementById("userBirthDate").value = birthdate;
                              }
                              if (userAddress != null) {
                                    document.getElementById("userAddress").value = address;
                              }
                              if (userCity != null) {
                                    document.getElementById("userCity").value = city;
                              }
                              if (userProvince != null) {
                                    document.getElementById("userProvince").value = province;
                              }
                              if (userCountry != null) {
                                    document.getElementById("userCountry").value = country;
                              }

                        })
            } else {
                  // No user is signed in.
                  console.log("No user is signed in");
            }
      });
}

//call the function to run it 
populateUserInfo();

// Demo 10 Step 1.3 Activate the edit button
function editUserInfo() {
      //Enable the form fields
      document.getElementById('personalInfoFields').disabled = false;
}

// Demo 10 Step 1.4 Activate the save button
function saveUserInfo(){
      // get information entered by user
      name.document.getElementById("name").value
      username.document.getElementById("userName").value
      email.document.getElementById("userEmail").value
      birthdate.document.getElementById("userBirthDate").value
      address.document.getElementById("userAddress").value
      city.document.getElementById("userCity").value
      province.document.getElementById("userProvince").value
      country.document.getElementById("userCountry").value

      // Update will add fields as needed
      currentUser.update({
            name: name,
            userName: username,
            userEmail: email,
            userBirthDate: birthdate,
            userAddress: address,
            userCity: city,
            userProvince: province,
            userCountry: country,

      })
      .then(() => {
            console.log("Document successfully updated!");
      })
      
      document.getElementById("personalInfoFields").disabled = true;
}