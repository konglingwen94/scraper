const puppeteer = (await import("puppeteer")).default;
const fs = await import("fs");

const browser = await puppeteer.launch({
  headless: false,
  devtools: true,
  timeout: 30000000,
  args: ["--start-maximized"],
});

const page = await browser.newPage();
await page.setViewport({ width: 1200, height: 800 });

try {
  var savedCookies = JSON.parse(fs.readFileSync("cookies.json"));
} catch (error) {
  console.error("未找到 cookies 文件，解析 cookies 出错等异常错误");
  console.error("Error occurred:", error.stack);
}
// 加载保存的 cookies

if (savedCookies) {
  await page.setCookie(...savedCookies);
  await page.goto("https://www.douban.com/people/xbb2021/reviews");
  console.log("已从保存的 cookies 登录");
} else {
  console.log("未找到保存的 cookies，重新登录");

  // 跳转到密码登录页面
  try {
    await page.goto("https://accounts.douban.com/passport/login");
    await page.click(".account-tab-account");
    await page.waitForSelector("#username", { visible: true });

    // 输入用户名和密码并提交
    await page.type("#username", "18848828950");
    await page.type("#password", "k3402926");
    await page.click(".account-form-field-submit");
    // 等待登录完成，确保页面加载完成
    await page.waitForNavigation();
    // 获取登录后的 cookies
    const cookies = await page.cookies();

    // 将 cookies 保存到文件
    fs.writeFileSync("cookies.json", JSON.stringify(cookies));
    console.log("已登录并保存 cookies");
  } catch (error) {
    console.error("Error occurred:", error.stack);
  }
}

console.log("跳转到目标页面");
await page.goto("https://www.douban.com/people/xbb2021/reviews");

scraperContent();

async function scraperContent() {
  console.log("开始爬取页面内容");

  try {
    await page.waitForSelector(".unfold"); // 等待元素加载完成
    const buttons = await page.$$(".unfold");

    // 使用 Puppeteer 的高级 API 点击所有按钮
    for (const button of buttons) {
      // 等待加载后的元素滚动到页面可视区域、稳定显示后再点击
      await button.evaluate((el) => {
        
        return new Promise((resolve) => {
          el.scrollIntoView({ behavior: "smooth", block: "center" }); // 平滑滚动到按钮位置
          setTimeout(resolve, 1000); // 根据页面加载性能，适度调整，等待 1000 毫秒，避免出现`Error: Node is either not clickable or not an Element`
        });
      });

      await button?.click?.(); // 可能导致报错
    }
  } catch (error) {
    console.error("Error occurred:", error.stack);
  }

  const html = await page.$$eval(".review-content", (elements) => elements.map((el) => el.innerHTML));
  const text = await page.$$eval(".review-content", (elements) => elements.map((el) => el.innerText));

  fs.writeFileSync("fileHtml.json", JSON.stringify(html), { flag: "a" });
  fs.writeFileSync("fileText.json", JSON.stringify(text), { flag: "a" });

  const totalNum = await page.$eval(".thispage", (el) => el.getAttribute("data-total-page"));
  const thispageNum = await page.$eval(".thispage", (el) => el.innerText);
  if (thispageNum >= totalNum) {
    return;
  }
  await page.waitForSelector(".next"); // 等待元素加载完成
  try {
    await page.click(".next");
  } catch (error) {
    console.error(error);
  }

  scraperContent();
}

process.on("unhandledRejection", (reason, promise) => {
  console.error("未处理的 Promise 错误:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("未捕获的异常:", error);
});
