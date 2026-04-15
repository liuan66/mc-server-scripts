// By ChatGPT
// 可以用来看baritone api给了什么方法，并方便的复制给AI

const BaritoneAPI = Java.type("baritone.api.BaritoneAPI");
const baritone = BaritoneAPI.getProvider().getPrimaryBaritone();

const follow = baritone.getFollowProcess();
const methods = follow.getClass().getMethods(); // 这里是输出了getFollowProcess()下的方法
// const methods = follow.following().getClass().getMethods(); // 比如这个能输出getFollowProcess().following()的方法


let txt = FS.open("methods.txt");
Chat.log("方法列表已输出至 Macros/methods.txt 中");
for (let i = 0; i < methods.length; i++) {
    //Chat.log(methods[i].getName());
    txt.append(`${methods[i].getName()}\n`);
}
