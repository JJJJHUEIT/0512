let video;
let faceMesh;
let faces = [];

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
    // MediaPipe Face Mesh 索引：176 為右耳耳垂，400 為左耳耳垂
    // 由於我們在 push/pop 中使用了 scale(-1, 1)，繪圖座標會自動跟隨鏡像
    if (face.keypoints[176]) drawEarring(face.keypoints[176], w, h);
    if (face.keypoints[400]) drawEarring(face.keypoints[400], w, h);
  }
  pop();
}

function drawEarring(pt, imgW, imgH) {
  // 將偵測點從影片解析度 (640x480) 映射到顯示的大小 (imgW, imgH)
  let vW = video.width || 640;
  let vH = video.height || 480;
  let px = map(pt.x, 0, vW, 0, imgW);
  let py = map(pt.y, 0, vH, 0, imgH);

  fill(255, 255, 0); // 黃色
  noStroke();
  
  // 由耳垂位置開始，垂直向下畫出三個圓圈
  for (let i = 1; i <= 3; i++) {
    circle(px, py + (i * 15), 10); // 往下偏移 15 像素，半徑為 10
  }
}

function windowResized() {
  // 當視窗大小改變時，重新調整畫布大小
  resizeCanvas(windowWidth, windowHeight);
}
