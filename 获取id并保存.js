// 获取物品注册表
let client = Client.getRegistryManager();
let list = client.getItemIds();
let itemtext = "";

// 构建物品列表文本
for (let i = 0; i < list.size(); i++) {
    let item = list[i];
    itemtext += client.getItem(item).getName() + "\t" + item + "\n";
}

// 使用FS模块创建并写入文件
try {
    let fileName = "items_list.txt";
    
    // 检查并创建文件
    if (!FS.exists(fileName)) {
        FS.createFile("", fileName, true);
    }
    
    // 打开文件并写入内容
    let file = FS.open(fileName, "UTF-8");
    file.write(itemtext);
    
    // 直接使用文件名获取相对路径
    let relativePath = fileName;
    Chat.log(`物品列表已保存到: ${relativePath}`);
    
} catch (e) {
    Utils.copyToClipboard(e.toString())
}