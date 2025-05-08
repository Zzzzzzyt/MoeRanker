"use strict";

const LATEST_FORMAT = "v2";

const subsets = [
  { name: "*", display: "全部", checked: false },
  { name: "questionaire1_subset", display: "XP统一检测全国甲卷", checked: true },
  { name: "questionaire2_subset", display: "XP统一检测全国乙卷", checked: true },
  { name: "bgm200_subset", display: "Bangumi top 200", checked: false },
  { name: "bgm2000_subset", display: "Bangumi top 2000", checked: false },
  { name: "bgm20000_subset", display: "Bangumi top 20000", checked: false },
  { name: "kyoani_subset", display: "京阿尼合集", checked: false },
  { name: "touhou_new_subset", display: "东方project新作", checked: false },
  { name: "touhou_old_subset", display: "东方project旧作", checked: false },
  { name: "toaru_subset", display: "魔禁(超炮)系列", checked: false },
  // { name: "railgun_subset", display: "超炮Only", checked: false },
  { name: "arknights_subset", display: "明日方舟", checked: false },
  { name: "genshin_subset", display: "原神", checked: false },
  { name: "honkai3_subset", display: "崩坏3", checked: false },
  { name: "honkai_starrail_subset", display: "崩坏：星穹铁道", checked: false },
  { name: "zzz_subset", display: "绝区零", checked: false },
  { name: "wuthering_waves_subset", display: "鸣潮", checked: false },
  { name: "snowbreak_subset", display: "尘白禁区", checked: false },
  { name: "onmyoji_subset", display: "阴阳师", checked: false },
  { name: "fate_subset", display: "Fate系列", checked: false },
  { name: "jojo_subset", display: "JOJO系列", checked: false },
  // { name: "gundam_subset", display: "高达系列", checked: false },
  { name: "naruto_subset", display: "火影忍者", checked: false },
  { name: "bleach_subset", display: "死神(BLEACH)", checked: false },
  { name: "madoka_subset", display: "魔法少女小圆", checked: false },
  { name: "AOT_subset", display: "进击的巨人", checked: false },
  { name: "jujutsu_subset", display: "咒术回战", checked: false },
  // { name: "lol_subset", display: "英雄联盟LOL", checked: false },
  // { name: "vocaloid_subset", display: "虚拟歌姬", checked: false },
  // { name: "conan_subset", display: "名侦探柯南", checked: false },
  { name: "lovelive_subset", display: "LoveLive!系列", checked: false },
  { name: "bangdream_subset", display: "BanG Dream!系列", checked: false },
  // { name: "revue_subset", display: "少女☆歌剧", checked: false },
  { name: "derby_subset", display: "赛马娘", checked: false },
  { name: "kancolle_subset", display: "舰队Collection", checked: false },
  { name: "kanR_subset", display: "战舰少女", checked: false },
  { name: "azur_lane_subset", display: "碧蓝航线", checked: false },
  { name: "blue_archive_subset", display: "蔚蓝档案", checked: false },
  // { name: "girls_frontline_subset", display: "少女前线", checked: false },
  // { name: "GUP_subset", display: "少女与战车", checked: false },
  // { name: "key3_subset", display: "Key社三部曲", checked: false },
  // { name: "pokemon_char_subset", display: "宝可梦系列角色", checked: false },
  // { name: "pokemon_subset", display: "宝可梦", checked: false },
  // { name: "pony_subset", display: "彩虹小马", checked: false },
  { name: "idolmaster_subset", display: "偶像大师系列", checked: false },
  { name: "ES_subset", display: "偶像梦幻祭", checked: false },
  { name: "PCR_subset", display: "公主连结Re:Dive", checked: false },
  { name: "housamo_subset", display: "炼金工房系列", checked: false },
  // { name: "atelier_subset", display: "东京放课后召唤师", checked: false },
  // { name: "kamen_rider_subset", display: "假面骑士系列", checked: false },
  { name: "danganronpa_subset", display: "弹丸论破", checked: false },
  { name: "persona_subset", display: "女神异闻录系列", checked: false },
  // { name: "RWBY_subset", display: "RWBY", checked: false },
];

const ignoreAttr = new Set([
  "AB型",
  "A型",
  "B型",
  "O型",
  "RH-O型",
  "RH型",
  "稀有血型",
  "第一人称Atashi",
  "特殊第一人称",
  "与声优同生日",
]);

var currentIndex = 0;
var currentSubset = null;

var char_index, attr_index, char2attr;
var attr2article;
var importance = [];
var char2set = [];
var moegirl2bgm;
var char2id = new Map();
var attr2id = new Map();
var rating = null;
var ratingHistory = null;
// var images = null;

const useStorage = storageAvailable("localStorage");

function packState() {
  // pack rating history
  var ratingHistory2 = [];
  ratingHistory.forEach((entry) => {
    const name = char_index[entry.id];
    ratingHistory2.push({ name: name, score: entry.score });
  });
  ratingHistory2 = JSON.stringify(ratingHistory2);
  const currentIndex2 = currentIndex.toString();

  // pack current subset
  var currentSubset2 = [];
  currentSubset.forEach((id) => {
    const name = char_index[id];
    currentSubset2.push(name);
  });
  currentSubset2 = JSON.stringify(currentSubset2);

  // pack checked subsets
  const checkedSubsets = [];
  const list = document.querySelector("#score-panel .subset-list").querySelectorAll('input[id*="subset"]');
  for (const node of list) {
    const checked = node.checked;
    const name = subsets[parseInt(node.id.replace("tab-score-subset-", ""))].name;
    if (checked) {
      checkedSubsets.push(name);
    }
  }
  const checkedSubsets2 = JSON.stringify(checkedSubsets);

  const settings = JSON.stringify({
    score: {
      random: document.getElementById("tab-score-random").checked,
      forceMapping: document.getElementById("tab-score-force-mapping").checked,
      kImage: document.getElementById("tab-score-k-image").value,
    },
    predict: {
      forceMapping: document.getElementById("tab-predict-force-mapping").checked,
    },
  });

  const pack = {
    dataFormat: LATEST_FORMAT,
    ratingHistory: ratingHistory2,
    currentSubset: currentSubset2,
    currentIndex: currentIndex2,
    checkedSubsets: checkedSubsets2,
    settings: settings,
  };
  // console.log("packed:", pack);
  return pack;
}

function unpackState(pack) {
  console.log("unpacking:", pack);

  // unpack checked subsets
  if (pack.checkedSubsets) {
    const checkedSubsets = JSON.parse(pack.checkedSubsets);
    for (var i = 0; i < subsets.length; i++) {
      const node = document.getElementById(`tab-score-subset-${i}`);
      if (checkedSubsets.indexOf(subsets[i].name) !== -1) {
        node.checked = true;
      } else {
        node.checked = false;
      }
    }
  }
  if (!(pack.ratingHistory && pack.currentSubset && pack.currentIndex)) {
    return false;
  }
  const packFormat = pack.dataFormat;
  const ratingHistory2 = JSON.parse(pack.ratingHistory);
  const currentSubset2 = JSON.parse(pack.currentSubset);
  var currentIndex2 = parseInt(pack.currentIndex);

  if (!packFormat) {
    console.log("Old packed data detected");
    upgradeRatingHistory(ratingHistory2);
  }

  rating = [];
  for (var i = 0; i < attr_index.length; i++) {
    rating.push(null);
  }

  // unpack rating history
  ratingHistory = [];
  currentIndex = currentIndex2;
  for (var i = 0; i < ratingHistory2.length; i++) {
    const entry = ratingHistory2[i];
    const name = entry.name;
    if (!char2id.has(name)) {
      console.warn(`character ${name} missing. Did index change?`);
      if (i <= currentIndex2) currentIndex--;
      continue;
    }

    const id = char2id.get(name);
    const val = entry.score;
    ratingHistory.push({ id: id, score: val });
  }

  // unpack current subset
  currentSubset = [];
  currentSubset2.forEach((name) => {
    if (!char2id.has(name)) {
      console.warn(`character ${name} missing. Did index change?`);
      return;
    }
    currentSubset.push(char2id.get(name));
  });

  if (pack.settings) {
    const settings = JSON.parse(pack.settings);
    if (settings.score) {
      const scoreSettings = settings.score;
      document.getElementById("tab-score-random").checked = scoreSettings.random;
      document.getElementById("tab-score-force-mapping").checked = scoreSettings.forceMapping;
      document.getElementById("tab-score-k-image").value = Math.max(parseInt(scoreSettings.kImage), 0);
    }
    if (settings.predict) {
      const predictSettings = settings.predict;
      document.getElementById("tab-predict-force-mapping").checked = predictSettings.forceMapping;
    }
  }

  compute();
  return true;
}

function saveState() {
  if (!useStorage) return false;
  try {
    const pack = packState();
    window.localStorage.setItem("dataFormat", pack.dataFormat);
    window.localStorage.setItem("ratingHistory", pack.ratingHistory);
    window.localStorage.setItem("currentSubset", pack.currentSubset);
    window.localStorage.setItem("currentIndex", pack.currentIndex);
    window.localStorage.setItem("checkedSubsets", pack.checkedSubsets);
    window.localStorage.setItem("settings", pack.settings);
  } catch (e) {
    console.error(e);
    return false;
  }
  // console.log("state saved");
  return true;
}

function loadState() {
  if (!useStorage) return false;
  try {
    return unpackState({
      dataFormat: window.localStorage.getItem("dataFormat"),
      ratingHistory: window.localStorage.getItem("ratingHistory"),
      currentSubset: window.localStorage.getItem("currentSubset"),
      currentIndex: window.localStorage.getItem("currentIndex"),
      checkedSubsets: window.localStorage.getItem("checkedSubsets"),
      settings: window.localStorage.getItem("settings"),
    });
  } catch (e) {
    console.error(e);
    return false;
  }
}

function downloadState() {
  const blob = new Blob([JSON.stringify(packState())], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const element = document.createElement("a");
  element.setAttribute("href", url);
  element.setAttribute("download", "state.json");
  element.style.display = "none";
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

function uploadState() {
  if (currentIndex != 0) {
    if (!confirm("真的要覆盖当前进度吗？")) {
      return;
    }
  }

  const element = document.getElementById("upload_state");
  if (element.files.length == 1) {
    const file = element.files[0];
    element.value = "";
    console.log("file uploaded:", file);
    file.text().then((text) => {
      const pack = JSON.parse(text);
      unpackState(pack);
      refresh();
      saveState();
    });
  }
}

function fetchData() {
  function printToPage(msg) {
    document.getElementById("loading-output").innerHTML += `<pre style="margin:0;">${msg}</pre>`;
  }

  var importanceTmp;

  var fetchMain = fetch("data/data_min.json")
    .then((response) => response.json())
    .then((data) => {
      ({ char_index, attr_index, char2attr, attr2article } = data);
      console.log(char_index);
      for (var i = 0; i < char_index.length; i++) {
        char2id.set(char_index[i], i);
        char2set.push(new Set(char2attr[i]));
      }
      for (var i = 0; i < attr_index.length; i++) {
        attr2id.set(attr_index[i], i);
      }
      const msg = `main data loaded: char_index.length=${char_index.length} attr_index.length=${attr_index.length}`;
      printToPage(msg);
      console.log(msg);
    });

  var fetchMap = fetch("data/moegirl2bgm.json")
    .then((response) => response.json())
    .then((data) => {
      moegirl2bgm = data;
      const msg = `mapping loaded: moegirl2bgm.length=${Object.keys(moegirl2bgm).length}`;
      printToPage(msg);
      console.log(msg);
    });

  var fetchSubset = [];
  for (var i = 1; i < subsets.length; i++) {
    const subid = i;
    fetchSubset.push(
      fetch(`data/subsets/${subsets[i].name}.json`).then((response) => {
        if (!response.ok) {
          const msg = `subset ${subsets[subid].name} not loaded: ${response.status}`;
          printToPage(`<span style="color:red;">${msg}</span>`);
          console.log(msg);
          subsets[subid].display += ' <span style="color:red;">ERROR</span>';
          subsets[subid].subset = [];
        } else {
          return response.json().then((data) => {
            subsets[subid].subset = data;
            const msg = `subset ${subsets[subid].name} loaded: length=${data.length}`;
            printToPage(msg);
            console.log(msg);
          });
        }
      })
    );
  }

  var fetchImportance = fetch("data/importance.json")
    .then((response) => response.json())
    .then((data) => {
      const msg = `importance loaded: length=${Object.keys(data).length}`;
      printToPage(msg);
      console.log(msg);
      importanceTmp = data;
    });

  // var fetchImageMap = fetch("data/bgm_images_medium_mapped.json")
  //   .then((response) => response.json())
  //   .then((data) => {
  //     const msg = `image preload map loaded: length=${Object.keys(data).length}`;
  //     printToPage(msg);
  //     console.log(msg);
  //     images = data;
  //   });

  Promise.all([Promise.all(fetchSubset), fetchMain, fetchImportance, fetchMap]).then(() => {
    for (var i = 0; i < attr_index.length; i++) {
      importance.push(importanceTmp[attr_index[i]]);
    }
    displaySubsets();
    const loaded = loadState();
    if (loaded) {
      const msg = `locaStorage loaded: ratingHistory=${ratingHistory.length} currentSubset=${currentSubset.length}`;
      console.log(msg);
      printToPage(msg);
    } else {
      if (useStorage) {
        const msg = "localStorage available but loading failed. Is this the first session?";
        console.info(msg);
        printToPage(msg);
      }
      ratingHistory = [];
      rating = [];
      for (var i = 0; i < attr_index.length; i++) {
        rating.push(null);
      }
    }
    printToPage("all set let's gooooooooooooooooooooooo");

    if (!loaded) {
      currentSubset = subsets[0].subset;
      reset();
    }

    document.querySelectorAll(".subset-panel").forEach((e) => {
      e.style.display = "block";
    });
    document.getElementById("result-panel").style.display = "block";
    document.getElementById("loading-output").style.display = "none";
    refresh();
  });
}

fetchData();

function name2URL(name) {
  return name.replace(" ", "_");
}

function attr2URL(attrid) {
  const url = attr2article[attrid];
  if (url === undefined) {
    return null;
  }
  if (url === "") {
    return attr_index[attrid];
  }
  return url;
}

function getImageURL(bid, type) {
  // if (type === undefined) {
  //   type = "medium";
  // }
  // if (type === "medium" && images !== null) {
  //   var url = images[bid];
  //   if (url !== undefined) {
  //     return "https://lain.bgm.tv/r/400/pic/crt/l/" + url;
  //   }
  // }
  return `https://api.bgm.tv/v0/characters/${bid}/image?type=${type}`;
}

function displaySubsets() {
  const allSubset = [];
  for (var i = 0; i < char_index.length; i++) {
    allSubset.push(i);
  }
  subsets[0].subset = allSubset;
  for (var i = 1; i < subsets.length; i++) {
    const tmpSubset = [];
    for (var j = 0; j < subsets[i].subset.length; j++) {
      const id = char2id.get(subsets[i].subset[j]);
      if (id === undefined) {
        console.warn("in subset but not in char_index?", subsets[i].subset[j]);
        continue;
      }
      tmpSubset.push(id);
    }
    subsets[i].subset = tmpSubset;
  }

  document.querySelector("#tab-score .subset-list").innerHTML = genSubsetlist("tab-score");
  document.querySelector("#tab-predict .subset-list").innerHTML = genSubsetlist("tab-predict");
}

function genSubsetlist(tab) {
  var tmpHtml = "";
  for (var i = 0; i < subsets.length; i++) {
    var cnt = 0;
    for (var j of subsets[i].subset) {
      if (moegirl2bgm[char_index[j]] !== undefined) cnt++;
    }
    tmpHtml += `<div class="form-check">
    <input class="form-check-input" type="checkbox" id="${tab}-subset-${i}" ${subsets[i].checked ? "checked" : ""}
     ${subsets[i].subset.length === 0 ? "disabled" : ""} />
    <label class="form-check-label" for="${tab}-subset-${i}"> 
    ${subsets[i].display} <span style="background-color:${colorize2(cnt / subsets[i].subset.length, 0, 1)}">
    (${cnt}/${subsets[i].subset.length})</span></label>
    </div>`;
  }
  return tmpHtml;
}

function refresh(index) {
  const start_button = document.getElementById("start-button");
  if (currentIndex == 0) {
    start_button.innerText = "启动！！";
    start_button.className = "form-control btn btn-success";
  } else {
    start_button.innerText = "重来！！";
    start_button.className = "form-control btn btn-warning";
  }
  if (currentIndex >= currentSubset.length) {
    const nameElement = document.getElementById("name");
    nameElement.innerText = "已完全遍历";
    document.getElementById("progress-text").innerText = `${currentSubset.length} / ${currentSubset.length}`;
    nameElement.href = "https://www.bilibili.com/bangumi/play/ep29854?t=1292";
    document.getElementById("images").innerHTML = `<a id="bangumi-link" href="https://bgm.tv/character/302" target="_blank">
    <img src="assets/img/omedetou.gif" style="padding:10px;max-height:500px;max-width:100%;object-fit:contain"/></a>`;
    return;
  }

  if (index === undefined) {
    index = currentIndex;
  }
  const id = currentSubset[index];
  const char = char_index[id];
  const nameElement = document.getElementById("name");
  nameElement.innerText = char;
  nameElement.href = "https://zh.moegirl.org.cn/" + name2URL(char);
  document.getElementById("progress-text").innerText = `${index + 1} / ${currentSubset.length}`;

  var debug = `${char_index[id]}: `;
  for (const attr of char2attr[id]) {
    debug += attr_index[attr] + " ";
  }
  console.log(debug);

  const oldPreload = document.head.getElementsByClassName("char-image-preloader");
  for (const i of oldPreload) {
    i.remove();
  }
  for (var i = currentIndex - 2; i <= currentIndex + 5; i++) {
    if (i < 0 || i >= currentSubset.length) continue;
    const mid = currentSubset[i];
    const ids = moegirl2bgm[char_index[mid]];
    if (ids === undefined) continue;
    for (var j of ids) {
      const img = new Image();
      img.src = getImageURL(j, "medium");
    }
  }

  const ids = moegirl2bgm[char];
  var tmp = "";
  const lim = Number.parseInt(document.getElementById("tab-score-k-image").value);
  if (ids !== undefined) {
    for (var j = 0; j < ids.length && j < lim; j++) {
      tmp += `<a href="https://bgm.tv/character/${ids[j]}" target="_blank">
      <img src="${getImageURL(
        ids[j],
        "medium"
      )}" alt="人物图片" style="padding:10px;max-height:500px;max-width:100%;object-fit:contain"/></a>`;
    }
  } else if (lim > 0) {
    tmp += `<a href="https://bgm.tv/character/13004" target="_blank">
      <img src="assets/img/akarin.jpg" alt="无映射" style="padding:10px;max-height:500px;max-width:100%;object-fit:contain"/></a>`;
  }
  document.getElementById("images").innerHTML = tmp;
}

function genSubset(tab) {
  const tmpSet = new Set();
  for (var i = 0; i < subsets.length; i++) {
    subsets[i].checked = document.getElementById(`${tab}-subset-${i}`).checked;
    if (subsets[i].checked) {
      for (var j of subsets[i].subset) {
        tmpSet.add(j);
      }
    }
  }
  const forceMapping = document.getElementById(`${tab}-force-mapping`).checked;
  const ret = [];
  tmpSet.forEach((val) => {
    if (forceMapping && moegirl2bgm[char_index[val]] === undefined) {
      return;
    }
    ret.push(val);
  });
  return ret;
}

function reset() {
  if (currentIndex != 0) {
    if (!confirm("真的要重新开始吗？")) {
      return;
    }
  }

  var random = document.getElementById("tab-score-random");
  if (random === null) {
    random = false;
  } else {
    random = random.checked;
  }
  currentSubset = genSubset("tab-score");
  if (random) {
    currentSubset = shuffle(currentSubset);
  }
  currentIndex = 0;
  console.log(`new subset generated: length=${currentSubset.length}`);
  ratingHistory = [];
  document.getElementById("ranking-hint").style.display = "block";
  document.getElementById("ranking-table").style.display = "none";
  document.getElementById("ranking-table").getElementsByTagName("tbody")[0].innerHTML = "";
  saveState();
  refresh();
}

function onScore(val) {
  if (currentIndex >= currentSubset.length) {
    return;
  }
  const id = currentSubset[currentIndex];
  console.log(`score ${val} for ${char_index[id]}`);
  ratingHistory.push({ id: id, score: val });
  currentIndex++;

  const auto_compute = document.getElementById("auto-compute");
  if (auto_compute.checked) {
    scheduleCompute();
  }

  refresh();
  scheduleSaveState();
  // compute();
}

function onSkip() {
  if (currentIndex >= currentSubset.length) {
    return;
  }
  const id = currentSubset[currentIndex];
  ratingHistory.push({ id: id, score: null });
  currentIndex++;

  const auto_compute = document.getElementById("auto-compute");
  if (auto_compute.checked) {
    scheduleCompute();
  }

  scheduleSaveState();
  refresh();
}

function onRevert() {
  if (ratingHistory.length == 0) {
    return;
  }
  // console.log(ratingHistory);
  const { id, score } = ratingHistory.pop();
  console.log(`revert ${score} for ${char_index[id]}`);
  // compute();
  currentIndex--;

  const auto_compute = document.getElementById("auto-compute");
  if (auto_compute.checked) {
    scheduleCompute();
  }

  saveState();
  refresh();
}

function upgradeRatingHistory(his) {
  console.log("Upgrading old ratingHistory");
  const conv = new Map([
    [-16, -5],
    [-12, -5],
    [-8, -4],
    [-4, -3],
    [-2, -2],
    [-1, -1],
    [0, 0],
    [1, 1],
    [2, 2],
    [4, 3],
    [8, 4],
    [12, 5],
    [16, 5],
  ]);
  for (var i = 0; i < his.length; i++) {
    const score = his[i].score;
    if (score == null) continue;
    if (conv.has(score)) {
      his[i].score = conv.get(score);
    } else {
      console.log("Unknown old score:", score);
    }
  }
}

function compute() {
  const compute_button = document.getElementById("compute-button");

  function resetComputeButton() {
    compute_button.innerText = "刷新结果";
    compute_button.removeAttribute("disabled");
  }

  if (ratingHistory.length === 0) {
    console.log("No data to compute");
    resetComputeButton();
    return;
  }

  const t = Date.now();

  const mp = new Map();

  const attrMap = new Map();
  ratingHistory.forEach(({ id, score }) => {
    if (score === null) return;
    char2attr[id].forEach((attr) => {
      if (attrMap.has(attr)) {
        attrMap.set(attr, attrMap.get(attr) + 1);
      } else {
        attrMap.set(attr, 1);
      }
    });
    if (mp.has(score)) {
      mp.set(score, mp.get(score) + 1);
    } else {
      mp.set(score, 1);
    }
  });

  const attrs = [];
  const attrSet = new Set();
  attrMap.forEach((value, key, map) => {
    if (value >= 3) {
      attrs.push(key);
      attrSet.add(key);
    }
  });
  console.log(`attrMap.size=${attrMap.size} filtered=${attrs.length}`);

  const [avg, std] = weighedNormalDist(mp);
  console.log("Stat of scores:");
  console.log(`avg=${avg}, std=${std}`);
  console.log(Array.from(mp.entries()).sort((a, b) => a[0] - b[0]));

  const stat = [];
  for (var i = 0; i < attr_index.length; i++) {
    stat[i] = { n_test: 0, n_control: 0, s_test: 0, s_control: 0 };
  }

  function newScore(score) {
    return (score - avg) / std;
  }

  for (var i = 0; i < ratingHistory.length; i++) {
    const id = ratingHistory[i].id;
    const score = ratingHistory[i].score;
    if (score === null) continue;
    const s = newScore(score);
    attrs.forEach((attr) => {
      if (char2set[id].has(attr)) {
        stat[attr].n_test++;
        stat[attr].s_test += s;
      } else {
        stat[attr].n_control++;
        stat[attr].s_control += s;
      }
    });
  }

  const result = [];
  for (var i = 0; i < attr_index.length; i++) {
    if (!attrSet.has(i)) {
      rating[i] = null;
      continue;
    }
    const n_test = stat[i].n_test;
    const n_control = stat[i].n_control;
    const s_test = stat[i].s_test;
    const s_control = stat[i].s_control;
    if (n_test === 0 || n_control === 0) {
      rating[i] = null;
      continue;
    }
    const avg1 = s_test / n_test;
    const avg2 = s_control / n_control;
    // const [avg1, std1] = normalDist(test);
    // const [avg2, std2] = normalDist(control);
    const delta = avg1 - avg2;
    const countFactor = Math.min(1.8, Math.max(0, Math.log((n_test * n_control) / (n_test + n_control) / 2 + 1) - 0.7));
    // const stdFactor = 1 / (Math.max(2, std1) * Math.max(2, std2));
    const rt = delta * countFactor * 10;
    rating[i] = {
      attr: i,
      rating: rt,
      avg1: avg1,
      // std1: std1,
      n1: n_test,
      avg2: avg2,
      // std2: std2,
      n2: n_control,
      delta: delta,
      countFactor: countFactor,
      // stdFactor: stdFactor,
    };
    result.push(rating[i]);
  }

  result.sort((a, b) => {
    return b.rating - a.rating;
  });

  var cnt = 0;
  var tmp = "";
  for (var i = 0; i < result.length; i++) {
    if (result[i].count <= 2) continue;
    if (Math.abs(result[i].rating) < 0.05) continue;

    const attr_name = attr_index[result[i].attr];
    if (ignoreAttr.has(attr_name)) continue;
    var attr_tag = attr_name;
    const attr_url = attr2URL(result[i].attr);
    if (attr_url !== null) {
      attr_tag = `<a href="${"https://zh.moegirl.org.cn/" + attr_url}" target="_blank">${attr_name}</a>`;
    }
    cnt++;
    tmp += `<tr><th scope="row">${cnt}</th><td>${attr_tag}</td>
  <td style="background: ${colorize(result[i].rating, 4)}">${result[i].rating.toFixed(2)}</td>
  <td>${result[i].avg1.toFixed(2)}/${result[i].n1}
    ${colorspan(result[i].delta, 8)}
    ${colorspan2(result[i].countFactor, 0, 1.8)}
  </td>
  </tr>`;
  }
  if (tmp.length > 0) {
    document.getElementById("ranking-hint").style.display = "none";
    document.getElementById("ranking-table").style.display = "block";
    document.getElementById("ranking-table").getElementsByTagName("tbody")[0].innerHTML = tmp;
  }

  resetComputeButton();
  console.log(`Compute finished result.length=${cnt} attr_count=${attrMap.size} time=${Date.now() - t}ms`);
}

function makeDebounce(callback, wait) {
  let timeoutId = null;
  return (...args) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => {
      callback(...args);
    }, wait);
  };
}

function isMobile() {
  if (navigator.userAgentData) {
    return navigator.userAgentData.mobile;
  }
  return /Mobi/i.test(navigator.userAgent);
}

const scheduleSaveState = makeDebounce(saveState, 200);
const scheduleCompute = makeDebounce(
  () => {
    const compute_button = document.getElementById("compute-button");

    if (compute_button.hasAttribute("disabled")) {
      console.warn("is a previous computation unfinished?");
    }

    compute_button.innerText = "计算中...";
    compute_button.setAttribute("disabled", "");

    setTimeout(() => {
      compute();
    }, 0);
  },
  isMobile() ? 200 : 50
);

["tab-score-random", "tab-score-force-mapping", "tab-score-k-image", "tab-predict-force-mapping"].forEach((id) => {
  document.getElementById(id).addEventListener("change", () => {
    scheduleSaveState();
  });
});
document.getElementById("auto-compute").addEventListener("change", () => {
  if (document.getElementById("auto-compute").checked) scheduleCompute();
});

function predict(subset) {
  const t = Date.now();

  var prediction = [];
  for (var ii = 0; ii < subset.length; ii++) {
    const i = subset[ii];
    const scores = [];
    char2attr[i].forEach((attr) => {
      const rt = rating[attr];
      if (rt === null) return;
      if (ignoreAttr.has(attr_index[attr])) return;
      scores.push({ rating: rt.rating, attr: attr });
    });
    scores.sort((a, b) => {
      return -(a.rating - b.rating);
    });
    var sum = 0;
    var impsum = 0;
    const scores2 = [];
    for (var j = 0; j < 6 && j < Math.ceil(scores.length / 2); j++) {
      const s = scores[scores.length - 1 - j];
      sum += s.rating * importance[s.attr];
      impsum += importance[s.attr];
      scores2.push({
        score: s.rating * importance[s.attr],
        rating: s.rating,
        weight: importance[s.attr],
        attr: s.attr,
      });
    }
    for (var j = 0; j < 6 && j < Math.floor(scores.length / 2); j++) {
      const s = scores[j];
      sum += s.rating * importance[s.attr];
      impsum += importance[s.attr];
      scores2.push({
        score: s.rating * importance[s.attr],
        rating: s.rating,
        weight: importance[s.attr],
        attr: s.attr,
      });
    }
    scores2.sort((a, b) => {
      return -a.score + b.score;
    });
    impsum += Math.max(0, 12 - scores.length);
    if (sum !== 0) {
      prediction.push({
        score: sum / impsum,
        impsum: impsum,
        id: i,
        scores: scores2,
      });
    }
  }
  prediction.sort((a, b) => {
    return -(a.score - b.score);
  });

  console.log(`Prediction finished prediction.length=${prediction.length} time=${Date.now() - t}ms`);
  return prediction;
}

function resetPrediction() {
  const subset = genSubset("tab-predict");
  const prediction = predict(subset, rating);
  var tmp = "";
  var max = 0;
  var min = 0;
  for (var i of prediction) {
    const x = i.score;
    if (x > 0) {
      max = Math.max(max, x);
    } else {
      min = Math.min(min, x);
    }
  }

  for (var i = 0; i < prediction.length; i++) {
    const cur = prediction[i];
    var tmp2 = "";
    for (var j = 0; j < cur.scores.length; j++) {
      const score = cur.scores[j];
      const tmp3 = attr_index[score.attr];
      if (attr_index[score.attr].article !== undefined) {
        tmp2 += ` <a href="https://zh.moegirl.org.cn/${name2URL(attr_index[score.attr].article)}" target="_blank">${tmp3}</a>`;
      } else {
        tmp2 += " " + tmp3;
      }
      // tmp2 += `${colorspan2(score.score, -3, 8)} ${colorspan2(score.rating, -3, 8)} ${colorspan(score.weight, 0, 3)}`;
      tmp2 += `${colorspan2(score.score / cur.impsum, -1.5, 1.5)}`;
    }
    tmp += `<tr><td>${i + 1}</td>
    <td><a href="https://zh.moegirl.org.cn/${name2URL(char_index[cur.id])}" target="_blank">${char_index[cur.id]}</a></td>
    <td style="background-color:${colorize(cur.score, min, max)}">${cur.score.toFixed(2)}</td><td>${tmp2}</td></tr>`;
  }
  document.getElementById("prediction-table").getElementsByTagName("tbody")[0].innerHTML = tmp;
}

function changeTab() {
  const radios = document.querySelectorAll("#tab-list>input");
  function toggle(radio, tabid) {
    document.getElementById(tabid).style.display = radio.checked ? "block" : "none";
  }
  toggle(radios[0], "tab-score");
  toggle(radios[1], "tab-predict");
}

function weighedNormalDist(arr) {
  var avg = 0;
  var n = 0;
  for (const [x, w] of arr) {
    avg += x * w;
    n += w;
  }
  avg /= n;
  var std = 0;
  for (const [x, w] of arr) {
    const diff = x - avg;
    std += diff * diff * w;
  }
  std = Math.sqrt(std / n);
  return [avg, std];
}

function NormalDist(arr) {
  var avg = 0;
  for (i of arr) {
    avg += i;
  }
  avg /= arr.length;
  var std = 0;
  for (i of arr) {
    std += (i - avg) * (i - avg);
  }
  std = Math.sqrt(std / arr.length);
  return [avg, std];
}

function colorize(val, limit1, limit2, center) {
  if (limit2 === undefined) {
    limit2 = -limit1;
  }
  if (center === undefined) {
    center = 0;
  }
  if (limit1 > limit2) {
    [limit1, limit2] = [limit2, limit1];
  }
  if (val > center) {
    const f = (Math.min(limit2, val) - center) / (limit2 - center);
    return `hsl(120 80% ${(100 - f * 40).toFixed(0)}%)`;
  } else {
    const f = (Math.max(limit1, val) - center) / (limit1 - center);
    return `hsl(0 80% ${(100 - f * 30).toFixed(0)}%)`;
  }
}

function colorize2(val, limit1, limit2) {
  if (limit2 === undefined) {
    limit2 = 0;
  }
  if (limit1 > limit2) {
    [limit1, limit2] = [limit2, limit1];
  }
  var f = Math.max(limit1, Math.min(limit2, val));
  f = (f - limit1) / (limit2 - limit1);
  return `hsl(${(f * 120).toFixed(0)} 80% 70%)`;
}

function colorspan(val, limit1, limit2, center) {
  return `<span style="background-color:${colorize(val, limit1, limit2, center)}">${val.toFixed(2)}</span>`;
}

function colorspan2(val, limit1, limit2) {
  return `<span style="background-color:${colorize2(val, limit1, limit2)}">${val.toFixed(2)}</span>`;
}

function signedExp(x, a) {
  if (a > 0) {
    return Math.pow(x, a) - 1;
  }
  return -(Math.pow(x, -a) - 1);
}

function shuffle(array) {
  let currentIndex = array.length,
    randomIndex;
  while (currentIndex != 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }

  return array;
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max + 1);
  return Math.floor(Math.random() * (max - min) + min);
}

// https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API#testing_for_availability
function storageAvailable(type) {
  let storage;
  try {
    storage = window[type];
    const x = "__storage_test__";
    storage.setItem(x, x);
    storage.removeItem(x);
    return true;
  } catch (e) {
    return (
      e instanceof DOMException &&
      // everything except Firefox
      (e.code === 22 ||
        // Firefox
        e.code === 1014 ||
        // test name field too, because code might not be present
        // everything except Firefox
        e.name === "QuotaExceededError" ||
        // Firefox
        e.name === "NS_ERROR_DOM_QUOTA_REACHED") &&
      // acknowledge QuotaExceededError only if there's something already stored
      storage &&
      storage.length !== 0
    );
  }
}

function randomScoreAll() {
  while (currentIndex < currentSubset.length) {
    onScore(getRandomInt(0, 10));
  }
}
