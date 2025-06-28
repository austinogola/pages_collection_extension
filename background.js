let results = [];
let activeTabs = 0;
let queueIndex = 0;
const MAX_CONCURRENT_TABS = 5;



const checkCookiesForReg=()=>{
    chrome.cookies.getAll({ name:null }, async(cookies) => {
        // console.log(cookies)
        const registry = await fetch(chrome.runtime.getURL("registry.json")).then(r => r.json())
         console.log('registry',registry)
          const regNames = registry.map(item=>item.name)
           console.log(regNames)

           const foundOpt = []
           const foundRegistry = []

           const nonReg=[]

        //  cookies.forEach(ck=>{
            for(const ck of cookies){
                if(regNames.includes(ck.name)){
                    // console.log(`${ck.name} is in registry`)
                    const regIndex = regNames.indexOf(ck.name)
                    const regObj = registry[regIndex]
                     foundRegistry.push(ck)
                    // console.log(`OPT VALUE of ${regObj.name} is ${regObj.value}`);
                    // console.log(`Cookies value of ${ck.name} is ${ck.value}`)



                    if(regObj.value == ck.value){
                        // console.log('Cookie is opt out');
                        // console.log(ck)
                        // console.log(regObj);
                        foundOpt.push(ck)
                        
                    }
                    else{
                        // console.log('Cookie is NOT opt out');
                       
                    }
                    
                
                }else{
                    nonReg.push(ck)
                }
         }

           console.log('ALL cookie items ', cookies);
            console.log('Cookie items found in registry', foundRegistry);
           console.log('Cookie items not in registry', nonReg);

         console.log('Cookie items in registry AND are opt out', foundOpt);
       
         
    })
}

// checkCookiesForReg()

function processSite(url, queue) {
    // console.log(`https://${url}`)
  chrome.tabs.create({ url:url, active: false }, (tab) => {
    const tabId = tab.id;

    // const uRLL = new URL(`https://${url}`);
    // const domain = uRLL.hostname;
    //  console.log(registry)
    setTimeout(() => {
        if(TEST_TYPE=='non_block_non_pharmacy'){
          chrome.tabs.reload(tabId)
          setTimeout(() => {
              chrome.tabs.remove(tabId);
              activeTabs--;
              processQueue(queue);
          }, 15000);
        }else{
           chrome.tabs.remove(tabId);
           activeTabs--;
          processQueue(queue);
        }
        
    //   chrome.cookies.getAll({ name:registry.name }, (cookies) => {

        
    //   });
    }, 15000);
  });
}

let queue = [];
function processQueue(sites) {
  while (activeTabs < MAX_CONCURRENT_TABS && sites[0]) {
    let url = sites.pop();
    if(TEST_TYPE=='sites' || TEST_TYPE=='blacklisted_domains' || TEST_TYPE =='known_merchants'){
      url = `https://${url}`

    }
    // url = `https://${url}`
    activeTabs++;
    processSite(url, sites);
  }
}

async function loadMerchantSites() {
  const [ sites] = await Promise.all([
    fetch(chrome.runtime.getURL("merchants.json")).then(r => r.json())
  ]);
//   console.log(sites)
  return [...new Set(sites)];
}

async function loadSearchSites() {
  const [ sites] = await Promise.all([
    fetch(chrome.runtime.getURL("search_pages.json")).then(r => r.json())
  ]);
//   console.log(sites)
  return [...new Set(sites)];
}


async function loadNormalSites() {
  const [ sites] = await Promise.all([
    fetch(chrome.runtime.getURL("normal_sites.json")).then(r => r.json())
  ]);
//   console.log(sites)
  return [...new Set(sites)];
}


async function loadNonBlackListAndNonPharmacySites() {
  const [ sites] = await Promise.all([
    fetch(chrome.runtime.getURL("non_blacklist_non_pharmacy.json")).then(r => r.json())
  ]);
//   console.log(sites)
  return [...new Set(sites)];
}


function pickRandomValues(arr, n) {
  if (n > arr.length) {
    throw new Error("Cannot pick more elements than are in the array.");
  }

  // Create a shallow copy to avoid modifying the original
  const copy = [...arr];

  // Shuffle the copy using Fisher-Yates algorithm
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  // Return the first n elements
  return copy.slice(0, n);
}

async function loadBlackListedDomains() {
  const [ sites] = await Promise.all([
    fetch(chrome.runtime.getURL("blacklisted_domains.json")).then(r => r.json())
  ]);
//   console.log(sites)
  const randomSites= pickRandomValues(sites,50)
  return [...new Set(randomSites)];
}

async function loadKnownMerchants() {
  const [ sites] = await Promise.all([
    fetch(chrome.runtime.getURL("known_merchants.json")).then(r => r.json())
  ]);
//   console.log(sites)
  const randomSites= pickRandomValues(sites,50)
  return [...new Set(randomSites)];
}

async function loadExcludedGlobes() {
  const [ sites] = await Promise.all([
    fetch(chrome.runtime.getURL("exclude_globes.json")).then(r => r.json())
  ]);
//   console.log(sites)
  return [...new Set(sites)];
}

async function loadPharmacySites() {
  const [ sites] = await Promise.all([
    fetch(chrome.runtime.getURL("pharmacy_sites.json")).then(r => r.json())
  ]);
//   console.log(sites)
  return [...new Set(sites)];
}

async function loadSitesWithAds() {
  const [ sites] = await Promise.all([
    fetch(chrome.runtime.getURL("sites_with_ads.json")).then(r => r.json())
  ]);
//   console.log(sites)
  return [...new Set(sites)];
}

let TEST_TYPE='sites_with_ads'

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "startCookieCheck") {
    results = [];
    activeTabs = 0;
    queueIndex = 0;

    if(TEST_TYPE=='merchant'){
        loadMerchantSites().then((sites) => {
          queue = sites;
          processQueue(sites);
        });
    } 
    else if(TEST_TYPE=='search_pages'){
        loadSearchSites().then((sites) => {
          queue = sites;
          processQueue(sites);
        });
    } 
    else if(TEST_TYPE=='non_block_non_pharmacy'){
        loadNonBlackListAndNonPharmacySites().then((sites) => {
          queue = sites;
          processQueue(sites);
        });
    } 
    else if(TEST_TYPE=='normal_pages'){
        loadNormalSites().then((sites) => {
          queue = sites;
          processQueue(sites);
        });
    } 
    else if(TEST_TYPE=='excluded_globes'){
        loadExcludedGlobes().then((sites) => {
          queue = sites;
          processQueue(sites);
        });
    } 
    else if(TEST_TYPE=='blacklisted_domains'){
        loadBlackListedDomains().then((sites) => {
          queue = sites;
          processQueue(sites);
        });
    } 
     else if(TEST_TYPE=='known_merchants'){
        loadKnownMerchants().then((sites) => {
          queue = sites;
          processQueue(sites);
        });
    } 
    
     else if(TEST_TYPE=='pharmacy_sites'){
        loadPharmacySites().then((sites) => {
          queue = sites;
          processQueue(sites);
        });
    } 

    else if(TEST_TYPE=='sites_with_ads'){
        loadSitesWithAds().then((sites) => {
          queue = sites;
          processQueue(sites);
        });
    } 

    sendResponse({ started: true });
  }
});
