# 暖账本 · 发布说明

暖账本是纯静态网页：页面文件（HTML/CSS/JS/图标）放在任意静态托管上即可，账本数据只保存在每位用户自己的手机/电脑浏览器里，不需要服务器、不需要数据库、也不会集中到任何人的电脑。

## 方式一：Netlify Drop（最简单，1 分钟）

1. 电脑浏览器打开 https://app.netlify.com/drop
2. 把本文件夹直接拖进页面（或拖 `warm-ledger.zip` 压缩包）
3. 页面会立即生成一个公网链接，例如 `https://xxxx.netlify.app`
4. 手机打开这个链接即可使用，电脑可以关机

## 方式二：GitHub Pages（免费、长期稳定）

1. 注册/登录 GitHub，新建一个仓库（如 `warm-ledger`）
2. 把本文件夹里的 `index.html`、`css`、`js`、`icons`、`manifest.webmanifest`、`sw.js` 上传到仓库根目录
3. 仓库 Settings → Pages → Source 选择分支后保存
4. 得到链接 `https://你的用户名.github.io/warm-ledger/`，手机可直接打开

## 方式三：自己电脑当临时服务器（调试用）

```powershell
cd "D:\AI Codeing\account book project\formal attempt"
node server.js
```

电脑访问 `http://127.0.0.1:8765/`，同一 Wi-Fi 的手机访问 `http://电脑IP:8765/`（需要防火墙放行 8765 端口）。此方式电脑必须开机，仅适合调试。

## 数据与隐私

- 每个设备浏览器本地保存自己的账号和账本，互不可见
- 换设备或换浏览器：设置 → 数据 → 导出备份，再到新设备导入
- 清理浏览器缓存前请先导出备份
