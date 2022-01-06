const axios = require("axios");
const iconv = require("iconv-lite");
const cheerio = require("cheerio");
const fs = require("fs");
const { transcode } = require("buffer");

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
  let params = {
    url: "http://www.530p.com/xuanhuan/dazhuzai-163183/",
    method: "GET",
    responseType: "stream",
  };

  let htmlRes = await axios(params).then((res) => deCodeFun(res.data, "gbk"));

  let $ = cheerio.load(htmlRes);

  let chapterInfo = []; // 章节信息

  $(".clc a").each((index, a) => {
    let route = $(a).prop("href");
    chapterInfo.push({
      title: $(a).text(),
      url: `http://www.530p.com${route}`,
    });
  });

  let limit = 5; // 并发下载数量限制

  // 什么时候下载结束?
  // 下载失败怎么办?

  const download = async (arr) => {
    let cache = []; // 即将被下载的数据
    let fail = []; // 下载失败的数据
    if (arr.length > 0) {
      cache = arr.splice(0, limit);
    } else if (fail.length > 0) {
      cache = fail.splice(0, limit);
      arr = fali
    } else {
      console.log("下载完成");
      return;
    }

    let all = cache.map(
      (v) =>
        new Promise((r) => {
          axios({
            url: v.url,
            method: "GET",
            responseType: "stream",
          })
            .then((res) => deCodeFun(res.data, "gbk"))
            .then(r)
            .catch((err) => {
              console.log("下载失败了: ", err.message);
              fail.push(v);
              r()
            });
        })
    );

    // console.log(all);
    let res = await Promise.all(all);

    res.forEach((item, index) => {
      if (item === undefined) return
      let $ = cheerio.load(item);

      let title = $("#cps_title h1").text().replace
      let content = $("#cp_content").text().trim().replace("无弹窗小说网(www.530p.com)", "");;
      console.log(`正在下载：${title}`);
      fs.writeFileSync(`./download/${title}.txt`, content);
    });

    await sleep(1000)

    await download(arr)
  };

  await download(chapterInfo);
};

fn();
