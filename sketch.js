let video;
let faceMesh;
let faces = [];

function preload() {
  // 改用 faceMesh，對於只有頭部入鏡的攝影機畫面辨識率極高
  faceMesh = ml5.faceMesh();
}

function setup() {
  // 建立全螢幕畫布
  createCanvas(windowWidth, windowHeight);
  // 擷取攝影機影像
  video = createCapture(VIDEO);
  video.size(640, 480); // 設定固定解析度以利辨識座標對應
  // 隱藏原始的 HTML 影片元件
  video.hide();

  // 開始持續偵測臉部
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

  // 新增：繪製畫布上方文字
  push();
  fill(0); // 設定文字顏色為黑色
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(32);
  text("412731068賴信宇", width / 2, y / 2 - 20);
  textSize(24);
  text("作品為影像辨識_耳環臉譜", width / 2, y / 2 + 20);
  pop();

  push();
  // 將座標系移動到影像預定位置的右緣，準備進行翻轉
  translate(x + w, y);
  // 水平翻轉 (x 軸 -1)
  scale(-1, 1);
  // 繪製影像
  image(video, 0, 0, w, h);

  // 若辨識到臉部特徵點，則在左右耳處畫出三個黃色圓圈 (耳環效果)
  if (faces.length > 0) {
    let face = faces[0];
    
    // FaceMesh 中，132 為左耳垂附近，361 為右耳垂附近
    let leftEar = face.keypoints[132];
    let rightEar = face.keypoints[361];

    if (leftEar) drawEarring(leftEar.x, leftEar.y, w, h);
    if (rightEar) drawEarring(rightEar.x, rightEar.y, w, h);
  } else {
    // 若沒有偵測到臉部，顯示提示文字 (需先還原翻轉狀態以免字體左右相反)
    pop();
    fill(255, 100, 100);
    noStroke();
    textSize(24);
    textAlign(CENTER);
    text("正在尋找臉部... (請確保臉部在鏡頭前)", width / 2, y - 20);
    push(); // 補回 push 以免最後的 pop 報錯
  }
  pop();
}

function drawEarring(earX, earY, imgW, imgH) {
  // 將偵測到的原始影片座標(固定為 640x480)對應到畫面上顯示的影像大小
  // 改用固定的 640 與 480，避免影片尚未載入時造成座標計算錯誤
  let px = map(earX, 0, 640, 0, imgW);
  let py = map(earY, 0, 480, 0, imgH);

  fill(255, 204, 0); // 設定為較鮮豔的黃色
  stroke(255);       // 加上白色邊框讓耳環更明顯
  strokeWeight(2);
  
  // 稍微向下偏移模擬耳垂位置，垂直向下連續畫出三個圓圈
  let startY = py + 15;
  for (let i = 0; i < 3; i++) {
    circle(px, startY + (i * 15), 10);
  }
}

function windowResized() {
  // 當視窗大小改變時，重新調整畫布大小
  resizeCanvas(windowWidth, windowHeight);
}