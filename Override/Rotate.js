/**
 * 自动创建 "Rotate" 组 (超强兼容版)
 * 1. 包含中英文+国旗过滤
 * 2. 移除 DIRECT (除非无节点)
 * 3. 自动注入微软组
 */
function main(config) {
  const rotateGroupName = "Rotate";
  const iconUrl = "https://testingcf.jsdelivr.net/gh/shindgewongxj/WHATSINStash@master/icon/xbox.png";
  
  // ▼▼▼ 升级后的宽容过滤器 (包含英文城市名、国旗、USA等) ▼▼▼
  const keywords = "美|🇺🇸|US|USA|United States|America|Portland|Dallas|Oregon|Phoenix|Fremont|Silicon|Vegas|Los Angeles|San Jose|Santa Clara|Seattle|Chicago|New York|Washin";
  // 对应的正则字符串 (供内核使用)
  const filterString = `(?i)(${keywords})`;

  // --- 1. 准备节点 ---
  let finalProxies = [];
  let finalProviders = [];

  // A. 抓取“散装节点” (Profile 模式)
  if (config['proxies'] && config['proxies'].length > 0) {
    const regex = new RegExp(keywords, 'i'); // JS正则
    config['proxies'].forEach(node => {
      // 只要名字命中，就加进去
      if (node.name !== 'DIRECT' && node.name !== 'REJECT' && regex.test(node.name)) {
        finalProxies.push(node.name);
      }
    });
  }

  // B. 抓取“订阅集” (Subscription 模式)
  if (config['proxy-providers']) {
    finalProviders = Object.keys(config['proxy-providers']);
  }

  // C. 只有在真的一无所有时，才加 DIRECT，否则宁缺毋滥
  if (finalProxies.length === 0 && finalProviders.length === 0) {
    finalProxies.push("DIRECT");
  }

  // --- 2. 定义 Rotate 策略组 ---
  const newGroup = {
    name: rotateGroupName,
    type: "select",
    url: "http://www.gstatic.com/generate_204",
    interval: 300,
    icon: iconUrl,
    
    // 放入抓到的节点名
    proxies: finalProxies, 
    // 放入订阅集名 (强制放入，不管JS有没有读到节点)
    use: finalProviders,
    
    // 让内核去筛选订阅里的节点
    filter: filterString
  };

  // --- 3. 插入到列表 (排序) ---
  if (!config['proxy-groups']) config['proxy-groups'] = [];
  
  config['proxy-groups'] = config['proxy-groups'].filter(g => g.name !== rotateGroupName);

  const idx1 = config['proxy-groups'].findIndex(g => g.name === "手动切换");
  const idx2 = config['proxy-groups'].findIndex(g => g.name === "节点选择");
  const insertAfterIndex = Math.max(idx1, idx2);

  if (insertAfterIndex !== -1) {
    config['proxy-groups'].splice(insertAfterIndex + 1, 0, newGroup);
  } else {
    config['proxy-groups'].unshift(newGroup);
  }

  // --- 4. 自动注入微软组 ---
  const targetKeywords = ["Microsoft", "微软", "Xbox"];

  config['proxy-groups'].forEach(group => {
    const isTarget = targetKeywords.some(k => group.name.includes(k));
    // 只注入 select 类型的组
    const isSelectType = !group.type || group.type === 'select'; 

    if (isTarget && group.name !== rotateGroupName && isSelectType) {
      if (!group.proxies) group.proxies = [];
      if (!group.proxies.includes(rotateGroupName)) {
        group.proxies.unshift(rotateGroupName);
      }
    }
  });

  return config;
}
