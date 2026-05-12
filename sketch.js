let video;
let faceMesh;
let faces = [];

// 建立左右耳的穩定器
let leftEarStabilizer;
let rightEarStabilizer;

function preload() {
  // 載入 ml5.js 的 faceMesh 模型進行影像辨識
  faceMesh = ml5.faceMesh();
}

function setup() {
  // 建立全螢幕畫布
  createCanvas(windowWidth, windowHeight);
  // 擷取攝影機影像
  video = createCapture(VIDEO);
  video.size(640, 480); // 設定固定解析度以利座標映射
  // 隱藏原始的 HTML 影片元件
  video.hide();

  // 開始持續偵測臉部特徵點
  faceMesh.detectStart(video, gotFaces);

  // 初始化穩定器
  leftEarStabilizer = new EarringStabilizer();
  rightEarStabilizer = new EarringStabilizer();
}

function gotFaces(results) {
  // 將辨識結果存入 faces 變數
  faces = results;
}

function draw() {
  // 設定背景顏色為 e7c6ff
  background('#e7c6ff');

  // 在置中上方加上文字
  push();
  fill(0); // 設定文字顏色為黑色
  textAlign(CENTER, TOP);
  textSize(32);
  text("412731068賴信宇", width / 2, 30);
  textSize(24);
  text("作品為影像辨識_耳環臉譜", width / 2, 75);
  pop();

  let w = width * 0.5; // 畫布寬度的 50%
  let h = height * 0.5; // 畫布高度的 50%
  let x = (width - w) / 2; // 置中水平座標
  let y = (height - h) / 2; // 置中垂直座標

  push();
  // 將座標系移動到影像預定位置的右緣，準備進行翻轉
  translate(x + w, y);
  // 水平翻轉 (x 軸 -1)
  scale(-1, 1);
  // 繪製影像
  image(video, 0, 0, w, h);

  // 若辨識到臉部，則在左右耳垂處畫出耳環
  if (faces.length > 0) {
    let face = faces[0];
    
    // 確保 keypoints 存在後再進行更新
    // 132 與 361 是 MediaPipe FaceMesh 最穩定的耳垂邊界點
    let rightEarPt = face.keypoints[361] || face.keypoints[176];
    let leftEarPt = face.keypoints[132] || face.keypoints[400];

    let rightEar = rightEarStabilizer.update(rightEarPt, millis());
    let leftEar = leftEarStabilizer.update(leftEarPt, millis());

    if (rightEar.isVisible) {
      drawStableEarring(rightEar, w, h);
    }
    if (leftEar.isVisible) {
      drawStableEarring(leftEar, w, h);
    }
  }
  pop();
}

function drawStableEarring(state, imgW, imgH) {
  let vW = video.width || 640;
  let vH = video.height || 480;
  
  // 映射座標：因為外層已經做了 scale(-1, 1)，這裡直接映射 X 即可
  let px = map(state.x, 0, vW, 0, imgW);
  let py = map(state.y, 0, vH, 0, imgH);

  // 改用高對比紅色，增加可視度
  fill(255, 0, 0, state.opacity * 255); 
  stroke(255, 255, 255, state.opacity * 255); // 白色外框在紫色背景更亮
  strokeWeight(3);
  
  for (let i = 1; i <= 3; i++) {
    circle(px, py + (i * 18), 12); // 加大圓圈直徑
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

/**
 * 穩定器類別：整合 1-Euro Filter 與透明度控制
 */
class EarringStabilizer {
  constructor() {
    // 降低 minCutoff (0.05) 讓靜止時極度穩定，降低 beta (0.005) 讓移動更絲滑
    this.filterX = new OneEuroFilter(0.05, 0.005);
    this.filterY = new OneEuroFilter(0.05, 0.005);
    this.opacity = 0;
    this.lastPos = { x: 0, y: 0 };
  }

  update(pt, timestamp) {
    let isDetected = pt && pt.x !== undefined && pt.y !== undefined;
    
    // 1. 透明度平滑 (Fade in/out)
    let targetOpacity = isDetected ? 1.0 : 0.0;
    this.opacity += (targetOpacity - this.opacity) * 0.1; // 減緩淡入淡出，增加視覺連續性

    // 2. 座標過濾
    if (isDetected) {
      this.lastPos.x = this.filterX.filter(pt.x, timestamp);
      this.lastPos.y = this.filterY.filter(pt.y, timestamp);
    }

    return {
      x: this.lastPos.x,
      y: this.lastPos.y,
      opacity: this.opacity,
      isVisible: this.opacity > 0.01
    };
  }
}

/**
 * 1-Euro Filter 實作：濾除高頻抖動
 */
class OneEuroFilter {
  constructor(minCutoff, beta) {
    this.minCutoff = minCutoff;
    this.beta = beta;
    this.xPrev = null;
    this.dxPrev = 0;
    this.tPrev = null;
  }

  alpha(cutoff, te) {
    let tau = 1.0 / (2 * Math.PI * cutoff);
    return 1.0 / (1.0 + tau / te);
  }

  filter(value, timestamp) {
    if (this.tPrev === null) {
      this.tPrev = timestamp;
      this.xPrev = value;
      return value;
    }

    let te = (timestamp - this.tPrev) / 1000.0;
    this.tPrev = timestamp;

    let aD = this.alpha(1.0, te);
    let dValue = (value - this.xPrev) / te;
    let edValue = aD * dValue + (1.0 - aD) * this.dxPrev;
    this.dxPrev = edValue;

    let cutoff = this.minCutoff + this.beta * Math.abs(edValue);
    let a = this.alpha(cutoff, te);
    let result = a * value + (1.0 - a) * this.xPrev;
    this.xPrev = result;
    return result;
  }
}
