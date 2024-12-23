const puppeteer = (await import("puppeteer")).default;
const fs = await import("fs");

const browser = await puppeteer.launch({
  headless: false,
  devtools: true,
});
const page = await browser.newPage();
await page.setViewport({ width: 1200, height: 800 });

try {
  var savedCookies = JSON.parse(fs.readFileSync("cookies.json"));
} catch (error) {}
// 加载保存的 cookies

if (savedCookies) {
  await page.setCookie(...savedCookies);
  await page.goto("https://www.douban.com/people/xbb2021/reviews");
  console.log("已从保存的 cookies 登录");
} else {
  // 跳转到密码登录页面

  await page.click(".account-tab-account");

  // await loginTabBtn?.click();
  await page.waitForSelector("#username", { visible: true });
  // await loginTabBtn?.click()

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
}

async function scraperContent() {
  //   await page.waitForNavigation();

  await page.waitForSelector(".unfold"); // 等待元素加载完成
  const buttons = await page.$$(".unfold");

  // 使用 Puppeteer 的高级 API 点击所有按钮

  try {
    const buttons = await page.$$(".unfold");
    for (const button of buttons) {
      await page.waitForSelector(".unfold"); // 等待元素加载完成
      //   if (button) {
      //     const isVisible = await button.isIntersectingViewport(); // 检查是否可见
      //     if (!isVisible) {
      //       await button.scrollIntoViewIfNeeded(); // 滚动到可见位置
      //     }
      //   }
      //   await page.waitForTimeout(400);
      //   await page.waitFor(1000); // 早期版本的 Puppeteer 提供此方法
      await new Promise((resolve) => setTimeout(resolve, 100)); // 等待 2 秒
      await button.click(); // 可能导致报错
    }
  } catch (error) {
    console.error("Error occurred:", error.stack);
  }

  // console.log(buttons)

  await page.evaluate(() => {
    window.onload = () => {
      window.scrollTo(0, document.body.scrollHeight);
    };
  });

  const texts = await page.$$eval(".review-content", (elements) => elements.map((el) => el.innerHTML));
  //   console.log("Texts:", texts);
  fs.writeFileSync("body.json", JSON.stringify(texts), { flag: "a" });

  //   debugger;
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
  //   console.log("next:", next);

  //   debugger;
  scraperContent();
}

scraperContent();
