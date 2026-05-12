let video;
let faceMesh;
let handPose;
let faces = [];
let hands = [];
let earringImages = [];
let currentEarringImg;

// 用於平滑化耳環位置的變數
let smoothLeft = { x: 0, y: 0 };
let smoothRight = { x: 0, y: 0 };

function preload() {
  // 載入 ml5.js v1 模型
  // 在 preload 載入可確保 setup 執行前模型已準備就緒
  faceMesh = ml5.faceMesh({ maxFaces: 1, refineLandmarks: false, flipHorizontal: false });
  handPose = ml5.handPose({ flipHorizontal: false });

  // 載入 5 種耳環圖片
  earringImages[0] = loadImage('picture/acc1_ring.png');
  earringImages[1] = loadImage('picture/acc2_pearl.png');
  earringImages[2] = loadImage('picture/acc3_tassel.png');
  earringImages[3] = loadImage('picture/acc4_jade.png');
  earringImages[4] = loadImage('picture/acc5_phoenix.png');
  
  // 預設使用第一款
  currentEarringImg = earringImages[0];
}

function setup() {
  // 建立全螢幕畫布
  createCanvas(windowWidth, windowHeight);
  // 擷取攝影機影像
  video = createCapture(VIDEO, (stream) => {
    console.log("攝影機已啟動");
    // 確保攝影機啟動後再開始偵測臉部與手部
    faceMesh.detectStart(video, gotFaces);
    handPose.detectStart(video, gotHands);
  });
  video.size(640, 480); // 設定固定解析度以利辨識座標對應
  video.hide();
}

function gotFaces(results) {
  // 將辨識結果存入 faces 變數
  faces = results;
}

function gotHands(results) {
  // 將手勢辨識結果存入 hands 變數
  hands = results;
}

function draw() {
  // 繪製酷酷的動態漸層背景與星點
  drawCoolBackground();

  // 偵測手勢並切換耳環
  if (hands.length > 0) {
    let fingerCount = getFingerCount(hands[0]);
    // 當手指數量在 1~5 之間時切換圖片
    if (fingerCount >= 1 && fingerCount <= 5) {
      currentEarringImg = earringImages[fingerCount - 1];
    }
  }

  let w = width * 0.5; // 畫布寬度的 50%
  let h = height * 0.5; // 畫布高度的 50%
  let x = (width - w) / 2; // 置中水平座標
  let y = (height - h) / 2; // 置中垂直座標

  push();
  // 將座標系移動到影像預定位置的右緣，準備進行翻轉
  translate(x + w, y);
  // 水平翻轉 (x 軸 -1)
  scale(-1, 1);

  // 幫影像加一個科技感的發光邊框
  noFill();
  stroke(255, 255, 0, 150);
  strokeWeight(3);
  rect(-3, -3, w + 6, h + 6, 10);

  // 繪製影像
  image(video, 0, 0, w, h);

  // 若辨識到臉部，則在左右耳垂處畫出三個黃色圓圈 (耳環效果)
  if (faces.length > 0) {
    let face = faces[0];
    
    // 取得新的特徵點 (177: 左耳垂, 401: 右耳垂)
    let ptL = face.keypoints[177];
    let ptR = face.keypoints[401];

    if (ptL && ptR) {
      // 使用 lerp 進行平滑化處理，0.1 比 0.2 更穩但會稍微慢一點點
      smoothLeft.x = lerp(smoothLeft.x, ptL.x, 0.1);
      smoothLeft.y = lerp(smoothLeft.y, ptL.y, 0.1);
      smoothRight.x = lerp(smoothRight.x, ptR.x, 0.1);
      smoothRight.y = lerp(smoothRight.y, ptR.y, 0.1);

      drawEarring(smoothLeft, w, h);
      drawEarring(smoothRight, w, h);
    }
  }
  pop();

  // --- 文字移到最上層繪製 ---
  fill(255); // 白色文字在深色背景更明顯
  textSize(32); // 放大一點比較清楚
  textAlign(CENTER, TOP);
  
  // 為文字加上霓虹發光效果
  drawingContext.shadowBlur = 20;
  drawingContext.shadowColor = 'yellow'; 
  text("412731068賴信宇", width / 2, 30);
  text("作品為影像辨識_耳環臉譜", width / 2, 75);
  drawingContext.shadowBlur = 0; // 取消發光避免影響後續繪圖
}

function getFingerCount(hand) {
  let count = 0;
  let keypoints = hand.keypoints;

  // 判斷食指、中指、無名指、小指是否伸直 (Tip Y < Joint Y)
  if (keypoints[8].y < keypoints[6].y) count++;
  if (keypoints[12].y < keypoints[10].y) count++;
  if (keypoints[16].y < keypoints[14].y) count++;
  if (keypoints[20].y < keypoints[18].y) count++;

  // 判斷大拇指 (比較大拇指尖與食指根部的距離)
  let thumbTip = keypoints[4];
  let thumbBase = keypoints[2];
  let pinkyBase = keypoints[17];
  if (dist(thumbTip.x, thumbTip.y, pinkyBase.x, pinkyBase.y) > dist(thumbBase.x, thumbBase.y, pinkyBase.x, pinkyBase.y)) count++;

  return count;
}

function drawCoolBackground() {
  // 改成科技感的深藍色動態格線背景
  background(10, 15, 35); 
  
  stroke(0, 255, 255, 50); // 半透明的青色線條
  strokeWeight(1);
  
  let gridSize = 60;
  let xOffset = (frameCount * 0.5) % gridSize;
  let yOffset = (frameCount * 0.3) % gridSize;

  // 繪製垂直流動線
  for (let x = xOffset; x < width; x += gridSize) {
    line(x, 0, x, height);
  }
  // 繪製水平流動線
  for (let y = yOffset; y < height; y += gridSize) {
    line(0, y, width, y);
  }

  // 增加一些隨機漂浮的數位光點
  noStroke();
  fill(0, 255, 255, 100);
  for (let i = 0; i < 20; i++) {
    let nx = noise(i * 10, frameCount * 0.002) * width;
    let ny = noise(i * 20, frameCount * 0.002) * height;
    circle(nx, ny, 3);
  }
}

function drawEarring(pt, imgW, imgH) {
  if (!pt) return;
  // 將偵測到的影片座標對應到畫面上顯示的影像大小
  let px = map(pt.x, 0, video.width, 0, imgW);
  let py = map(pt.y, 0, video.height, 0, imgH);

  // 顯示耳環圖片
  // 將圖片中心點對準座標，並稍微往下偏移使其掛在耳垂
  push();
  imageMode(CENTER);
  // 調整大小 (這裡設定寬 40, 高 60) 並在 y 軸增加偏移使耳環自然下墜
  image(currentEarringImg, px, py + 25, 40, 60);
  pop();
  drawingContext.shadowBlur = 0;
}

function windowResized() {
  // 當視窗大小改變時，重新調整畫布大小
  resizeCanvas(windowWidth, windowHeight);
}