const axios = require("axios");
const iconv = require("iconv-lite");
const cheerio = require("cheerio");
const fs = require("fs");

// 解码函数
const deCodeFun = (stream, mode) =>
  new Promise((r, j) => {
    let data = stream;
    let streamArr = [];
    data.on("data", (chunk) => {
      streamArr.push(chunk);
    });

    data.on("end", () => {
      let a = Buffer.concat(streamArr);
      let res = iconv.decode(a, mode);
      // console.log("res: ", decodeData);
      r(res);
    });

    data.on("error", (err) => {
      j(err);
    });
  });

// 间断函数-防止操作过于频繁
const sleep = (n) =>
  new Promise((r) => {
    setTimeout(r, n);
  });

let fn = async () => {
  let option = {
    xuanhuan: "玄幻",
    yanqing: "言情",
    dushi: "都市",
    junshi: "军事",
    wuxia: "武侠",
    xianxia: "仙侠",
    lishi: "历史",
  };

  let listArr = [];

  // 控制进入不同的分类
  for (let key in option) {
    // 抓取到的内容的容器
    let ArticleInfo = {
      tag: option[key],
      content: [],
    };

    // 遍历分类下每一页
    for (let i = 1; i <= 10; i++) {
      let opt = {
        url: `http://www.530p.com/${key}/${i}.htm`,
        method: "GET",
        responseType: "stream",
      };

      let htmlRes = await axios(opt).then((res) => deCodeFun(res.data, "gbk"));
      // console.log("htmlRes: ", htmlRes);

      let $ = cheerio.load(htmlRes);

      let $ul = $(".conter ul");

      if ($ul.length <= 1) {
        console.log(`${option[key]} 分类下书籍已抓取完成`);
        break;
      }

      console.log(`开始抓取"${option[key]}" 分类下第${i}页数据`);

      $(".conter ul").each((index, ele) => {
        if (index === 0) return;
        let itemInfo = {
          name: $(ele).find(".conter1 a").text(),
          author: $(ele).find(".conter4").text(),
          update: $(ele).find(".conter3").text(),
          link: `http://www.530pp.com${$(ele).find(".conter1 a").prop("href")}`,
        };
        ArticleInfo.content.push(itemInfo);
        listArr.push(itemInfo);
      });
      // console.log(ArticleInfo, "-------");
      // 进入下一页的频率
      await sleep(100);
    }
  }

  fs.writeFileSync("./list.txt", JSON.stringify(listArr));

  console.log("抓取完成");
};

fn();
