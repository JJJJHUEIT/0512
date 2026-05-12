let video;
let faceMesh;
let handPose;
let faces = [];
let hands = [];
let earringImages = [];
let currentEarringIndex = 0;

function preload() {
  // 改用 faceMesh，對於只有頭部入鏡的攝影機畫面辨識率極高
  faceMesh = ml5.faceMesh();
  // 載入手勢辨識模型
  handPose = ml5.handPose();
  // 載入五種耳環圖片，並加入錯誤處理
  earringImages[0] = loadImage('./pic/acc/acc1_ring.png', () => console.log("acc1 loaded"), () => console.error("acc1 404"));
  earringImages[1] = loadImage('./pic/acc/acc2_pearl.png', () => console.log("acc2 loaded"), () => console.error("acc2 404"));
  earringImages[2] = loadImage('./pic/acc/acc3_tassel.png', () => console.log("acc3 loaded"), () => console.error("acc3 404"));
  earringImages[3] = loadImage('./pic/acc/acc4_jade.png', () => console.log("acc4 loaded"), () => console.error("acc4 404"));
  earringImages[4] = loadImage('./pic/acc/acc5_phoenix.png', () => console.log("acc5 loaded"), () => console.error("acc5 404"));
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
  // 開始持續偵測手勢
  handPose.detectStart(video, gotHands);
}

function gotFaces(results) {
  // 將辨識結果存入 faces 變數
  faces = results;
}

function gotHands(results) {
  // 將辨識結果存入 hands 變數
  hands = results;
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

  // 手勢辨識切換耳環索引
  if (hands.length > 0) {
    let fingerCount = getFingerCount(hands[0]);
    if (fingerCount >= 1 && fingerCount <= 5) {
      currentEarringIndex = fingerCount - 1;
    }
  }

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

    if (leftEar) drawEarring(leftEar.x, leftEar.y, w, h, 'left');
    if (rightEar) drawEarring(rightEar.x, rightEar.y, w, h, 'right');
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

  // 設定耳環寬度（約為影像寬度的 10%），並根據原圖比例計算高度
  let earringWidth = imgW * 0.1;
  let earringHeight = earringWidth * (earringImg.height / earringImg.width);

  // 繪製耳環圖片，中心點設在耳垂位置下方，讓耳環看起來像掛在耳朵上
  imageMode(CENTER);
  image(earringImg, px, py + earringHeight / 2, earringWidth, earringHeight);
  imageMode(CORNER); // 恢復預設模式以免影響其他繪圖作業
}

function windowResized() {
  // 當視窗大小改變時，重新調整畫布大小
  resizeCanvas(windowWidth, windowHeight);
}