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
  video.size(640, 480); 
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

  // 若辨識到臉部，則在左右耳垂處畫出三個黃色圓圈 (耳環效果)
  if (faces.length > 0) {
    let face = faces[0];
    // MediaPipe Face Mesh 索引：176 為右耳耳垂（鏡像後在畫面左側），400 為左耳耳垂（鏡像後在畫面右側）
    if (face.keypoints[176]) drawEarring(face.keypoints[176], w, h);
    if (face.keypoints[400]) drawEarring(face.keypoints[400], w, h);
  }
  pop();
}

function drawEarring(pt, imgW, imgH) {
  // 將偵測到的影片座標（預設 640x480）映射到畫面上實際顯示的影像寬高
  let px = map(pt.x, 0, 640, 0, imgW);
  let py = map(pt.y, 0, 480, 0, imgH);

  fill(255, 255, 0); // 設定圓圈顏色為黃色
  noStroke();
  
  // 由耳垂位置開始，垂直向下畫出三個圓圈
  for (let i = 1; i <= 3; i++) {
    circle(px, py + (i * 12), 8); // 往下偏移 12 像素，半徑為 8
  }
}

function windowResized() {
  // 當視窗大小改變時，重新調整畫布大小
  resizeCanvas(windowWidth, windowHeight);
}
