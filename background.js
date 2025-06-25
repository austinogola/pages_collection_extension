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
        chrome.tabs.remove(tabId);
        activeTabs--;
        processQueue(queue);
    //   chrome.cookies.getAll({ name:registry.name }, (cookies) => {

        
    //   });
    }, 25000);
  });
}

let queue = [];
function processQueue(sites) {
  while (activeTabs < MAX_CONCURRENT_TABS && sites[0]) {
    let url = sites.pop();
    if(TEST_TYPE=='sites'){
      url = `https//${url}`
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

let TEST_TYPE='merchant'
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

    

    sendResponse({ started: true });
  }
});
