import { update_quest_cards, initialize_map, update_map, toggle_view } from './modules/quest_display.js';

$(document).ready(async function () {
      $('#quest_cards_go_here').hide()
      var quest_html_node
      var tag_html_node
      var user_doc
      var all_quest_tags = {};
      await init();

      /**
       * Loads all needed data
       */
      async function init() {

            navigator.geolocation.getCurrentPosition(async (position) => {                          // Get player position
                  var user_location = [position.coords.latitude, position.coords.longitude];
                  console.log('user_location in position', user_location)

                  var map = await initialize_map(user_location);

                  await firebase.auth().onAuthStateChanged(async (user) => {
                        if (user) {
                              let quest_tag_db;
                              let quest_db;
                              [quest_html_node, tag_html_node, user_doc, quest_tag_db, quest_db] = await Promise.all
                                    ([$.get('reusable_html/quest_card.html'), // Quest card template from reusable html
                                    $.get('reusable_html/quest_tag.html'),   // Quest tag from reusable html
                                    db.collection("users").doc(user.uid).get(),
                                    db.collection('tags').get(),
                                    db.collection('quests').get()
                                    ]) // current user

                              quest_tag_db.forEach(tag_doc => {
                                    all_quest_tags[tag_doc.id] = tag_doc.data().tag_name;
                              })

                              update_map(map, quest_db, user_doc);
                              update_quest_cards(
                                    quest_db,
                                    quest_html_node,
                                    tag_html_node,
                                    user_location,
                                    all_quest_tags,
                                    user_doc
                              )
                        } else {
                              alert('User not signed in!')
                        }
                  });
            });
      }

});

$('#view_toggle').on('click', toggle_view)

function insertNameFromFirestore() {
      let currentUser = ""
      // Check if the user is logged in:
      firebase.auth().onAuthStateChanged(user => {
            if (user) {
                  console.log(user.uid); // Let's know who the logged-in user is by logging their UID
                  currentUser = db.collection("users").doc(user.uid); // Go to the Firestore document of the user
                  currentUser.get().then(userDoc => {
                        // Get the user name
                        var userName = userDoc.data().name;
                        console.log(userName);
                        //$("#name-goes-here").text(userName); // jQuery
                        document.getElementById("name-goes-here").innerText = userName;
                  })
            } else {
                  console.log("No user is logged in."); // Log a message when no user is logged in
            }
      })
}

insertNameFromFirestore()

// function saveBookmark(questdocID) {
//       // Manage the backend process to store the hikeDocID in the database, recording which hike was bookmarked by the user.
//       currentUser.update({
//             // Use 'arrayUnion' to add the new bookmark ID to the 'bookmarks' array.
//             // This method ensures that the ID is added only if it's not already present, preventing duplicates.
//             bookmarks: firebase.firestore.FieldValue.arrayUnion(hikeDocID)
//       })
//             // Handle the front-end update to change the icon, providing visual feedback to the user that it has been clicked.
//             .then(function () {
//                   //console.log(iconID);
//                   //this is to change the icon of the hike that was saved to "filled"
//                   document.getElementById("quest_bookmark").innerText = 'bookmark';
//             });
// }

//------------------------------------------------------------------------------------------TODO - Update saveBookmark and add to module--------------------------------------------------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------
// This function is called whenever the user clicks on the "bookmark" icon.
// It adds the hike to the "bookmarks" array
// Then it will change the bookmark icon from the hollow to the solid version.
//-----------------------------------------------------------------------------
// function saveBookmark(questDocID) {
//       // Manage the backend process to store the hikeDocID in the database, recording which hike was bookmarked by the user.
//       currentUser.update({
//             // Use 'arrayUnion' to add the new bookmark ID to the 'bookmarks' array.
//             // This method ensures that the ID is added only if it's not already present, preventing duplicates.
//             bookmarks: firebase.firestore.FieldValue.arrayUnion(questDocID)
//       })
//             // Handle the front-end update to change the icon, providing visual feedback to the user that it has been clicked.
//             .then(function () {
//                   console.log("bookmark has been saved for" + questDocID);
//                   var iconID = 'save-' + questDocID;
//                   //console.log(iconID);
//                   //this is to change the icon of the hike that was saved to "filled"
//                   document.getElementById(iconID).innerText = 'bookmark';
//             });
// }