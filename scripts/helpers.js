function log_tags() {
    db.collection('tags').get()
        .then(all_tags => {
            all_tags.forEach((doc) => {
                // doc.data() is never undefined for query doc snapshots
                console.log(doc.id, " => ", doc.data().tag_name);
            })
        });
}

/**
 * Run this to keep tags up to date with the amount of quests that use them (This should ideally be deprecated once we implement quest creation)
 */
async function write_tag_popularity() {              // ASYNC function so we can wait for the database response
    tag_db = await db.collection('tags').get()       // Here we wait until we get a response, no ned for .then() as the code will pause here
    tag_popularity = {}                              // empty dictionary to keep track of tags
    tag_id_list = []                                 // Empty list to store tag_ids
    tag_db.forEach(tag_doc => {                      // for each tag in the tag collection
        console.log(tag_doc.id)
        tag_id_list.push(tag_doc.id)                 // add the tag id to the list
        tag_popularity[tag_doc.id] = 0;              // associate that tag id with 0 in the dictionary
    });
    db.collection('quests').get().then(quests => {   // get the quests, THEN (alternative to async await) 
        quests.forEach(doc => {                      // for each quest in the collection:
            quest_tag_id_list = doc.data().tag_ids;  // store the tag_ids associated with the quest

            if (quest_tag_id_list[0] != "") {        // for each tag_id associated with that quest:
                for (let i = 0; i < quest_tag_id_list.length; i++) {
                    tag_popularity[quest_tag_id_list[i]]++ // increment the popularity of that tag_id in the dictionary
                }
            }
        })
        console.log(tag_popularity)
    }).then(() => {                                   // Once looping is done, THEN
        for (let i = 0; i < tag_id_list.length; i++)  // for each tag_id in the list we made earlier
            db.collection('tags').doc(tag_id_list[i]).update({ 'popularity': tag_popularity[tag_id_list[i]] }) // update the tag in the collection to include the popularity associated with it in the dictionary
    })
}
/**
 * Reads the quests and tag databases and adds a list of associated quests to each tag
 */
async function write_quest_ids_to_tags() {               // Async function because we are getting data from databases
    console.log('Reading tags...')
    tag_db = await db.collection('tags').get()           // Wait for tag db and store response
    console.log('Done.')
    console.log('Reading quests...')
    quest_db = await db.collection('quests').get()       // Wait for quest db and store response
    console.log('Done.')

    tag_quest_dict = {}                                  // Make empty dictionary to associate tag ids with a list of quest ids

    console.log('Adding tag_ids to dictionary...')
    tag_db.forEach(tag_doc => {
        console.log(`    Adding ${tag_doc.id} (${tag_doc.data().tag_name})...`)
        tag_quest_dict[tag_doc.id] = []                  // Add key/value pair (tag_id: empty list) for each tag id in the database so each id has an empty list
    })
    console.log('Done.')
    console.log(tag_quest_dict)

    quest_db.forEach(quest_doc => {                       // for each quest in the quest collection
        quest_id = quest_doc.id                           // store the current quest id                    
        console.log(`parsing ${quest_id} (${quest_doc.data().quest_name})...`)

        quest_tag_list = quest_doc.data().tag_ids         // get the tag_id list associated with that quest
        console.log(quest_tag_list)

        for (i = 0; i < quest_tag_list.length; i++) {     // for each tag in that list

            if (quest_tag_list[i] != "") {                // Skip empty lists (we decided to just add an empty string)
                console.log(`Found tag_id: ${quest_tag_list[i]}, appending quest...`)
                tag_quest_dict[quest_tag_list[i]].push(quest_id) // find the list associated with the tag_id in the dictionary and append the current quest id
            }
        }
    })                                                    // We now have a dictionary associating tag_ids with a list of quests that use them

    for (const tag_id in tag_quest_dict) {                // for each iag_id (key) in the dictionary:
        console.log(tag_id, tag_quest_dict[tag_id])
        db.collection('tags').doc(tag_id).update({ 'used_in_quests': tag_quest_dict[tag_id] }) // update the tag in the collection to include the list of quests that use that tag
    }
}

async function update_quest_name_list() {
    quest_name_list = []
    all_quests = await db.collection("quests").get();
    all_quests.forEach((quest_doc) =>{
        quest_name_list.push(quest_doc.data().quest_name)
    })
    console.log(quest_name_list)
    let quest_names_doc_id;
    quest_names_doc = await db.collection("quest_names").get();
    quest_names_doc.forEach((quest_name_list_doc)=>{             
        quest_names_doc_id = quest_name_list_doc.id;
    })

    db.collection('quest_names').doc(quest_names_doc_id).update({ 'all_quest_names': quest_name_list })
}

/**
 * This adds search keywords to each quest composed of its tags and the words in the title, ALL LOWERCASE
 */
async function add_keywords_to_quests(){
    let quest_collection = await db.collection("quests").get(); // get quest collection
    let tag_collection = await db.collection("tags").get(); // get tag collection
    tag_id_map = {};

    tag_collection.forEach((tag_doc)=>{                  // populate dictionary
        console.log(tag_doc.data().tag_name)
        tag_id_map[tag_doc.id] = tag_doc.data().tag_name;
    })
    console.log(tag_id_map)

    quest_collection.forEach((quest_doc)=>{
        keyword_list = quest_doc.data().quest_name.toLowerCase().split(' '); // break up quest name into lowercase words and store as a list
        if (quest_doc.data().tag_ids[0] != ''){
            for (let i = 0; i < quest_doc.data().tag_ids.length; i++){
                keyword_list.push(tag_id_map[quest_doc.data().tag_ids[i]].toLowerCase()) // get the tag name from the tag id, make it lowercase and add it to the keyword list
            }
        }
        console.log('keyword list:', keyword_list);
        db.collection('quests').doc(quest_doc.id).update({'keywords': keyword_list})
    })
}

function writeQuests() {
    //define a variable for the collection you want to create in Firestore to populate data
    var questRef = db.collection("quests");

    questRef.add({
        quest_name: "Reveal mysteries of human beings!",
        location_name: "Museum of Anthropology",
        location: [49.26961348051608, -123.25948381904506],
        rate: 5, //integer between 1 to 5
        cost: 2, // integer between 1 to 3
        description: "The Museum of Anthropology at the University of British Columbia (UBC) campus in Vancouver, British Columbia, Canada displays world arts and cultures, in particular works by First Nations of the Pacific Northwest. As well as being a major tourist destination, MOA is a research and teaching museum, where UBC courses in art, anthropology, archaeology, conservation, and museum studies are given. MOA houses close to 50,000 ethnographic objects, as well as 535,000 archaeological objects in its building alone.",
        tag_ids: ["j6MrxNTQVsVDqZZqKY3A"],
        image_name: "Museum of Anthropology",
    })

    questRef.add({
        quest_name: "Have a coffee at the top of Vancouver!",
        location_name: "Lupin's Cafe - Grouse Mountain",
        location: [49.37925579153738, -123.08358387425162],
        rate: 5, //integer between 1 to 5
        cost: 1, // integer between 1 to 3
        description: "Located on the main floor of the Peak Chalet, Lupins Café offers stunning decorative alpine features like high cedar beams and copper lights that emit a soft glow in the evening.",
        tag_ids: ["D4NeTY30U09lD3TemV4Y", "YFk0Z2I5rwxqH9ShsR8Z", "ntk5nt0wadhVx4A17Weu"],
        image_name: "Lupin's Cafe",
    })

    questRef.add({
        quest_name: "Let's see the world's narrowest commercial building!",
        location_name: "Sam Kee Building",
        location: [49.28054048497626, -123.10476746176596],
        rate: 2, //integer between 1 to 5
        cost: 1, // integer between 1 to 3
        description: "The Sam Kee Building at 8 West Pender Street is an internationally renowned narrow building, including a lower-level extension beneath the sidewalk, located at the traditional entry to Vancouver's historic Chinatown.",
        tag_ids: ["j6MrxNTQVsVDqZZqKY3A"],
        image_name: "Sam Kee Building",
    })

    questRef.add({
        quest_name: "Twisted tower - Can you believe it?",
        location_name: "Vancouver House",
        location: [49.27499326902219, -123.1310302325351],
        rate: 2, //integer between 1 to 5
        cost: 1, // integer between 1 to 3
        description: "Vancouver House is a neo-futurist residential skyscraper in Vancouver, British Columbia, Canada. Construction of the skyscraper began in 2016 and was expected to be finished by the end of 2019, but completion was postponed to summer of 2020. On April 15, 2021, a water pipe on the 29th floor burst and damaged 17 units as well as several elevators.",
        tag_ids: [""],
        image_name: "Vancouver House",
    })
}