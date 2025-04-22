// 用户配置文件
window.userConfig = {
  "pc": {
    // PC端游戏棋盘的行数
    "rows": 10,
    // PC端游戏棋盘的列数
    "cols": 16
  },
  "mobile": {
    // 移动端游戏棋盘的行数
    "rows": 10,
    // 移动端游戏棋盘的列数
    "cols": 5
  },
  // 是否使用SVG格式的表情图标，true为使用SVG，false为使用Unicode字符
  "useSvgEmoji": true,
  // SVG表情样式，可选 'twEmoji'或'openEmoji'
  "SvgStyle": "twEmoji",
  // 游戏卡牌颜色，可选值：gray,green,blue,purple,red,brown
  "tileFrontColor": "gray",
  // 背景音乐是否开启，true为开启，false为关闭
  "musicEnabled": false,
  // 游戏音效是否开启，true为开启，false为关闭
  "soundEnabled": true,
  // 背景音乐文件列表，游戏会随机选择播放，只需填写主文件名，不需要后缀
  "bgMusic": ["bgm_1", "bgm_2", "bgm_3", "bgm_4", "bgm_5", "bgm_6", "bgm_7"]
};