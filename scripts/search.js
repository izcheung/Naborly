$(document).ready(function () {
      var quest_card_template = $('#quest_card_template');
      var quest_card_node = quest_card_template.prop('content');  // get quest templates ready

      var quest_tag_template = $('#quest_tag_template');
      var quest_tag_node = quest_tag_template.prop('content');    // get tag template ready

      var quest_collection = db.collection('quests');
      var all_quest_tags = {};
      var quest_tag_array = [];
      var quest_name_array = []
      var currentArray = quest_tag_array;

      var user_location = [0, 0];
      var map;

      /**
       * Initialize the page by retrieving necessary data
       * 
       * This should: Get the player location, get a list of tag names, get a list of quest names, display the search bar and (?) an empty map.
       */
      async function init() {
            navigator.geolocation.getCurrentPosition(position => {                          // Get player position
                  user_location = [position.coords.latitude, position.coords.longitude];
                  console.log('user_location in position', user_location)
                  load_map();
            });

            quest_db = await db.collection('quests').get()

            tag_db = await db.collection('tags').get()                                     // get all tags
            tag_db.forEach(tag_doc => {
                  all_quest_tags[tag_doc.id] = tag_doc.data().tag_name;
                  quest_tag_array.push(tag_doc.data().tag_name)                            // add tag names to tag array
            })
            console.log('tag names:', all_quest_tags)
            let quest_name_collection = await db.collection('quest_names').doc('NJYbhL8TFCSnv3peyJPv').get()
            quest_name_array = quest_name_collection.data().all_quest_names               // Store list of all names
            console.log('quest names:', quest_name_array)
      }

      function load_map() {
            // Defines basic mapbox data
            console.log('user_location in load_map():', user_location)
            mapboxgl.accessToken = 'pk.eyJ1IjoiYWRhbWNoZW4zIiwiYSI6ImNsMGZyNWRtZzB2angzanBjcHVkNTQ2YncifQ.fTdfEXaQ70WoIFLZ2QaRmQ';
            map = new mapboxgl.Map({
                  container: 'map', // Container ID
                  style: 'mapbox://styles/mapbox/streets-v11', // Styling URL
                  center: [user_location[1], user_location[0]], // Make map start centered on user location
                  zoom: 8 // Starting zoom
            });

            // Add user controls to map
            map.addControl(new mapboxgl.NavigationControl());

            // Adds map features
            map.on('load', () => {
                  // Defines map pin icon for events
                  map.loadImage(
                        'https://cdn.iconscout.com/icon/free/png-256/pin-locate-marker-location-navigation-16-28668.png',
                        (error, image) => {
                              if (error) throw error;

                              // Add the image to the map style.
                              map.addImage('eventpin', image); // Pin Icon

                        }
                  );

                  // Add the image to the map style.
                  map.loadImage(
                        'https://cdn-icons-png.flaticon.com/512/61/61168.png',
                        (error, image) => {
                              if (error) throw error;

                              // Add the image to the map style with width and height values
                              map.addImage('userpin', image, { width: 10, height: 10 });

                              // Adds user's current location as a source to the map
                              navigator.geolocation.getCurrentPosition(position => {
                                    userLocation = [position.coords.longitude, position.coords.latitude];
                                    console.log(userLocation);
                                    if (userLocation) {
                                          map.addSource('userLocation', {
                                                'type': 'geojson',
                                                'data': {
                                                      'type': 'FeatureCollection',
                                                      'features': [{
                                                            'type': 'Feature',
                                                            'geometry': {
                                                                  'type': 'Point',
                                                                  'coordinates': userLocation
                                                            },
                                                            'properties': {
                                                                  'description': 'Your location'
                                                            }
                                                      }]
                                                }
                                          });

                                          // Creates a layer above the map displaying the user's location
                                          map.addLayer({
                                                'id': 'userLocation',
                                                'type': 'symbol',
                                                'source': 'userLocation',
                                                'layout': {
                                                      'icon-image': 'userpin', // Pin Icon
                                                      'icon-size': 0.05, // Pin Size
                                                      'icon-allow-overlap': true // Allows icons to overlap
                                                }
                                          });

                                          // Map On Click function that creates a popup displaying the user's location
                                          map.on('click', 'userLocation', (e) => {
                                                // Copy coordinates array.
                                                const coordinates = e.features[0].geometry.coordinates.slice();
                                                const description = e.features[0].properties.description;

                                                new mapboxgl.Popup()
                                                      .setLngLat(coordinates)
                                                      .setHTML(description)
                                                      .addTo(map);
                                          });

                                          // Change the cursor to a pointer when the mouse is over the userLocation layer.
                                          map.on('mouseenter', 'userLocation', () => {
                                                map.getCanvas().style.cursor = 'pointer';
                                          });

                                          // Defaults
                                          // Defaults cursor when not hovering over the userLocation layer
                                          map.on('mouseleave', 'userLocation', () => {
                                                map.getCanvas().style.cursor = '';
                                          });
                                    }
                              });
                        }
                  );
            });
      }

      function update_map(quest_db) {
            const features = []; // Defines an empty array for information to be added to

            quest_db.forEach(doc => {
                  lat = doc.data().location[0];
                  lng = doc.data().location[1];
                  // console.log(lat, lng);
                  coordinates = [lng, lat];
                  // console.log(coordinates);
                  // Coordinates
                  event_name = doc.data().quest_name; // Event Name
                  preview = doc.data().description; // Text Preview
                  img = doc.data().posterurl; // Image
                  // url = doc.data().link; // URL

                  // Pushes information into the features array
                  features.push({
                        'type': 'Feature',
                        'properties': {
                              'description': `<strong>${event_name}</strong><p>${preview}</p> <br> <a href="/hike.html?id=${doc.id}" target="_blank" title="Opens in a new window">Read more</a>`
                        },
                        'geometry': {
                              'type': 'Point',
                              'coordinates': coordinates
                        }
                  });
            });

            // Remove sources and layers if previous searches have been executed
            if (map.getLayer("places")) {
                  map.removeLayer("places");
            }
            if (map.getSource("places")) {
                  map.removeSource("places");
            }


            // Adds features as a source to the map
            map.addSource('places', {
                  'type': 'geojson',
                  'data': {
                        'type': 'FeatureCollection',
                        'features': features
                  }
            });

            // Creates a layer above the map displaying the pins
            map.addLayer({
                  'id': 'places',
                  'type': 'symbol',
                  // source: 'places',
                  'source': 'places',
                  'layout': {
                        'icon-image': 'eventpin', // Pin Icon
                        'icon-size': 0.1, // Pin Size
                        'icon-allow-overlap': true // Allows icons to overlap
                  }
            });

            // Map On Click function that creates a popup, displaying previously defined information from "events" collection in Firestore
            map.on('click', 'places', (e) => {
                  // Copy coordinates array.
                  const coordinates = e.features[0].geometry.coordinates.slice();
                  const description = e.features[0].properties.description;

                  // Ensure that if the map is zoomed out such that multiple copies of the feature are visible, the popup appears over the copy being pointed to.
                  while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
                  }

                  new mapboxgl.Popup()
                        .setLngLat(coordinates)
                        .setHTML(description)
                        .addTo(map);
            });

            // Change the cursor to a pointer when the mouse is over the places layer.
            map.on('mouseenter', 'places', () => {
                  map.getCanvas().style.cursor = 'pointer';
            });

            // Defaults cursor when not hovering over the places layer
            map.on('mouseleave', 'places', () => {
                  map.getCanvas().style.cursor = '';
            });
      }

      function update_quest_cards(quest_db) {
            $('#quest_cards_go_here').empty()
            quest_db.forEach(doc => {                          // iterate through each doc and for each:
                  var quest_name = doc.data().quest_name;          // get the quest name
                  var quest_rating = doc.data().rate;              // get value of the "details" key
                  var quest_price = doc.data().cost;               // get the price of the quest
                  var image_name = doc.data().image_name;          // get the name of the image
                  var quest_description = doc.data().description;  // gets the description field (TODO)
                  var quest_location = doc.data().location;
                  var quest_distance = calculateDistance(user_location, quest_location);
                  var quest_tag_id_list = doc.data().tag_ids       // get the list of tag ids
                  var quest_id = doc.id;                           // get the quest ids

                  // Clone the contents of the quest card template element (not the parent template element)
                  let new_quest_card = $(quest_card_node).children().clone();

                  //update title and text and image
                  new_quest_card.find('.quest_name').text(quest_name);
                  new_quest_card.find('.quest_rating').text('★'.repeat(quest_rating));
                  new_quest_card.find('.quest_price').text('$'.repeat(quest_price));
                  new_quest_card.find('.quest_description').text(quest_description);
                  new_quest_card.find('.quest_distance').text(quest_distance + 'km');
                  new_quest_card.find('.quest_image').attr('src', `./images/${image_name}.jpg`); // find image and put in new quest card
                  new_quest_card.find('.quest_detail_link').attr('href', `./quest-detail.html?quest_id=${quest_id}`); // set links to quest cards

                  if (quest_tag_id_list[0] != "") {
                        for (let i = 0; i < quest_tag_id_list.length; i++) {
                              let new_quest_tag = $(quest_tag_node).children().clone();
                              new_quest_tag.text(all_quest_tags[quest_tag_id_list[i]]);
                              new_quest_tag.appendTo(new_quest_card.find('.quest_tags_container'));
                        }
                  }
                  new_quest_card.appendTo('#quest_cards_go_here')
            })
      }

      function autocomplete(inp, arr) {
            /*the autocomplete function takes two arguments,
            the text field element and an array of possible autocompleted values:*/
            var currentFocus;
            /*execute a function when someone writes in the text field:*/
            inp.addEventListener("input", function (e) {
                  var a, b, i, val = this.value;
                  /*close any already open lists of autocompleted values*/
                  closeAllLists();
                  if (!val) { return false; }
                  currentFocus = -1;
                  /*create a DIV element that will contain the items (values):*/
                  a = document.createElement("DIV");
                  a.setAttribute("id", this.id + "autocomplete-list");
                  a.setAttribute("class", "autocomplete-items");
                  /*append the DIV element as a child of the autocomplete container:*/
                  this.parentNode.appendChild(a);
                  /*for each item in the array...*/
                  let count = 0;
                  for (i = 0; i < arr.length; i++) {
                        /*check if the item starts with the same letters as the text field value:*/
                        if (arr[i].toUpperCase().includes(val.toUpperCase())) { // EDIT to include any overlap
                              /*create a DIV element for each matching element:*/
                              b = document.createElement("DIV");
                              /*make the matching letters bold:*/
                              b.innerHTML += arr[i];
                              /*insert a input field that will hold the current array item's value:*/
                              b.innerHTML += "<input type='hidden' value='" + arr[i] + "'>";
                              /*execute a function when someone clicks on the item value (DIV element):*/
                              b.addEventListener("click", function (e) {
                                    /*insert the value for the autocomplete text field:*/
                                    inp.value = this.getElementsByTagName("input")[0].value;
                                    /*close the list of autocompleted values,
                                    (or any other open lists of autocompleted values:*/
                                    closeAllLists();
                              });
                              a.appendChild(b);
                              count++;
                        }
                        if (count >= 4) {     // Break when 4 suggestions reached (Prevents long lists)
                              break;
                        }
                  }
            });
            function closeAllLists(elmnt) {
                  /*close all autocomplete lists in the document,
                  except the one passed as an argument:*/
                  var x = document.getElementsByClassName("autocomplete-items");
                  for (var i = 0; i < x.length; i++) {
                        if (elmnt != x[i] && elmnt != inp) {
                              x[i].parentNode.removeChild(x[i]);
                        }
                  }
            }
            /*execute a function when someone clicks in the document:*/
            document.addEventListener("click", function (e) {
                  closeAllLists(e.target);
            });
      }
      /**
       * Initiate search for keywords in search bar and load relevant quests
       */
      $('#search_button').on('click', async function () {
            console.log('clicked search');
            let search_text = $('#myInput').val().toLowerCase();             // put text to lowercase to match keywords
            console.log('search text:', search_text);
            let search_keywords = search_text.split(' ');                    // split text into array of words
            console.log('search keywords:', search_keywords);
            let search_results = await db.collection('quests')               // get quests
            .where('keywords', 'array-contains-any', search_keywords).get(); // where quest keywords contain any word in search array
            update_map(search_results);                                      // update map with results
            update_quest_cards(search_results);                              // update cards with results
      })


      init()
      $('#quest_cards_go_here').hide();

      /*initiate the autocomplete function on the "myInput" element, and pass along the countries array as possible autocomplete values:*/
      autocomplete(document.getElementById("myInput"), currentArray);
})

function toggle_view() {
      console.log('switching...');
      console.log($('#view_toggle_text').text())
      switch ($('#view_toggle_text').text()) {
            case 'MAP': {
                  $('#view_toggle_text').text('LIST');
                  $('#map').show();
                  $('#quest_cards_go_here').hide();
                  break;
            } case 'LIST': {
                  $('#view_toggle_text').text('MAP');
                  $('#map').hide();
                  $('#quest_cards_go_here').show();
                  break;
            }
      }
}

function calculateDistance(current, destination) {
      // this function receives two arrays that represent coordinates and returns the distance in miles

      // calculate difference in longitude and latitude
      let longitude_difference = current[0] - destination[0]
      let latitude_difference = current[1] - destination[1]

      // calculate distance using Pythagorean theorem and convert it to mile
      let distance = ((longitude_difference ** 2 + latitude_difference ** 2) ** 0.5 * 60 * 1.60934).toFixed(1)
      return distance;
}



//------------------------------------------------
// Call this function when the "logout" button is clicked
//-------------------------------------------------
function logout() {
      firebase.auth().signOut().then(() => {
            // Sign-out successful.
            console.log("logging out user");
      }).catch((error) => {
            // An error happened.
      });
}
