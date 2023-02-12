const subsets = [
  { name: "*", display: "全部", checked: false },
  { name: "bgm200_subset", display: "Bangumi top 200", checked: true },
  { name: "bgm2000_subset", display: "Bangumi top 2000", checked: false },
  { name: "bgm20000_subset", display: "Bangumi top 20000", checked: false },
  { name: "kyoani_subset", display: "京阿尼合集", checked: false },
  { name: "touhou_new_subset", display: "东方project新作", checked: false },
  { name: "touhou_old_subset", display: "东方project旧作", checked: false },
  { name: "toaru_subset", display: "魔禁(超炮)系列", checked: false },
  { name: "railgun_subset", display: "超炮Only", checked: false },
  { name: "arknights_subset", display: "明日方舟", checked: false },
  { name: "genshin_subset", display: "原神", checked: false },
  { name: "fate_subset", display: "Fate系列", checked: false },
  { name: "jojo_subset", display: "JOJO系列", checked: false },
  { name: "gundam_subset", display: "高达系列", checked: false },
  { name: "naruto_subset", display: "火影忍者", checked: false },
  { name: "furry_subset", display: "兽娘属性", checked: false },
  { name: "lovelive_subset", display: "LoveLive!系列", checked: false },
  { name: "lol_subset", display: "英雄联盟LOL", checked: false },
  { name: "vocaloid_subset", display: "虚拟歌姬", checked: false },
  { name: "conan_subset", display: "名侦探柯南", checked: false },
  { name: "derby_subset", display: "赛马娘", checked: false },
  { name: "kanC_subset", display: "舰队Collection(舰C)", checked: false },
  { name: "kanR_subset", display: "战舰少女(舰R)", checked: false },
  { name: "kanB_subset", display: "碧蓝航线(舰B)", checked: false },
  { name: "blue_archive_subset", display: "蔚蓝档案", checked: false },
  { name: "key3_subset", display: "Key社三部曲", checked: false },
  { name: "pokemon_char_subset", display: "宝可梦系列角色", checked: false },
  { name: "pokemon_subset", display: "宝可梦", checked: false },
  { name: "pony_subset", display: "彩虹小马", checked: false },
  { name: "idolmaster_subset", display: "偶像大师系列", checked: false },
  { name: "ES_subset", display: "偶像梦幻祭", checked: false },
  { name: "PCR_subset", display: "公主连结Re:Dive", checked: false },
  { name: "RWBY_subset", display: "RWBY", checked: false },
  { name: "zzzyt_subset", display: "Zzzyt私货(测试用)", checked: false },
];

var currentIndex = 0;
var currentSubset = [];

var char_index, attr_index, char2attr;
var importanceTmp;
var importance = [];
var char2map = [];
var moegirl2bgm;
var char2id = new Map();
var attr2id = new Map();
var rating = [];
var ratingHistory = [];
var stat = [];

function printToPage(msg) {
  document.getElementById("loading-output").innerHTML += `<pre style="margin:0;">${msg}</pre>`;
}

var fetchMain = fetch("data/data_min.json")
  .then((response) => response.json())
  .then((data) => {
    ({ char_index, attr_index, char2attr } = data);
    console.log(char_index);
    for (var i = 0; i < char_index.length; i++) {
      char2id.set(char_index[i].name, i);
      char2map.push(new Set(char2attr[i]));
    }
    for (var i = 0; i < attr_index.length; i++) {
      attr2id.set(attr_index[i].name, i);
      rating.push(undefined);
      stat.push({ test: [], test_sum: 0, control: [], control_sum: 0 });
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

Promise.all([Promise.all(fetchSubset), fetchMain, fetchImportance, fetchMap]).then(() => {
  for (var i = 0; i < attr_index.length; i++) {
    importance.push(importanceTmp[attr_index[i].name]);
  }
  displaySubsets();
  document.querySelectorAll(".subset-panel").forEach((e) => {
    e.style.display = "block";
  });
  document.getElementById("result-panel").style.display = "block";
  document.getElementById("loading-output").style.display = "none";
  refresh();
});

function name2url(name) {
  return name.replace(" ", "_");
}

function displaySubsets() {
  const allSubset = [];
  for (var i = 0; i < char_index.length; i++) {
    allSubset.push(i);
  }
  currentSubset = allSubset;
  subsets[0].subset = allSubset;
  for (var i = 1; i < subsets.length; i++) {
    var tmpSet = new Set();
    for (var j = 0; j < subsets[i].subset.length; j++) {
      const id = char2id.get(subsets[i].subset[j]);
      if (id === undefined) {
        continue;
      }
      tmpSet.add(id);
    }
    const tmpSubset = [];
    for (var j = 0; j < char_index.length; j++) {
      if (tmpSet.has(j)) tmpSubset.push(j);
    }
    subsets[i].subset = tmpSubset;
  }
  var tmpHtml = "";
  for (var i = 0; i < subsets.length; i++) {
    var cnt = 0;
    for (var j of subsets[i].subset) {
      if (moegirl2bgm[char_index[j].name] !== undefined) cnt++;
    }
    tmpHtml += `<div class="form-check">
    <label class="form-check-label" for="flexCheckDefault"> 
    <input class="form-check-input" type="checkbox" subset-id="${i}" ${subsets[i].checked ? "checked" : ""}
     ${subsets[i].subset.length === 0 ? "disabled" : ""} />
    ${subsets[i].display} <span style="background-color:${colorize2(cnt / subsets[i].subset.length, 0, 1)}">
    (${cnt}/${subsets[i].subset.length})</span></label>
    </div>`;
  }
  document.querySelectorAll(".subset-panel").forEach((e) => {
    const div = e.querySelector(".subset-list");
    div.innerHTML = tmpHtml + div.innerHTML;
  });
  reset();
}

function refresh(index) {
  if (currentIndex >= currentSubset.length) {
    const nameElement = document.getElementById("name");
    nameElement.innerText = "已完全遍历";
    document.getElementById("progress-text").innerText = `${currentSubset.length} / ${currentSubset.length}`;
    nameElement.href = "https://www.bilibili.com/bangumi/play/ep29854?t=1292";
    document.getElementById("images").innerHTML = `<a id="bangumi-link" href="https://bgm.tv/character/302" target="_blank">
    <img src="assets/img/omedetou.gif" style="max-height:500px;max-width:100%;object-fit:contain"/></a>`;
    return;
  }
  if (index === undefined) {
    index = currentIndex;
  }
  const id = currentSubset[index];
  const char = char_index[id];
  const nameElement = document.getElementById("name");
  nameElement.innerText = char.name;
  nameElement.href = "https://zh.moegirl.org.cn/" + name2url(char.name);
  document.getElementById("progress-text").innerText = `${index + 1} / ${currentSubset.length}`;

  const oldPreload = document.head.getElementsByClassName("char-image-preloader");
  for (i of oldPreload) {
    i.remove();
  }
  for (var i = currentIndex - 2; i <= currentIndex + 5; i++) {
    if (i < 0 || i >= currentSubset.length) continue;
    const mid = currentSubset[i];
    const ids = moegirl2bgm[char_index[mid].name];
    if (ids === undefined) continue;
    for (var j of ids) {
      const preloadLink = document.createElement("link");
      preloadLink.href = `https://api.bgm.tv/v0/characters/${j}/image?type=medium`;
      preloadLink.rel = "preload";
      preloadLink.as = "image";
      preloadLink.class = "char-image-preloader";
      document.head.appendChild(preloadLink);
    }
  }

  const ids = moegirl2bgm[char.name];
  var tmp = "";
  if (ids !== undefined) {
    for (var j of ids) {
      tmp += `<a href="https://bgm.tv/character/${j}" target="_blank">
      <img src="https://api.bgm.tv/v0/characters/${j}/image?type=medium" alt="人物图片" style="max-height:500px;max-width:100%;object-fit:contain"/></a>`;
    }
  } else {
    tmp += `<a href="https://bgm.tv/character/13004" target="_blank">
      <img src="assets/img/akarin.jpg" alt="无映射" style="max-height:500px;max-width:100%;object-fit:contain"/></a>`;
  }
  document.getElementById("images").innerHTML = tmp;
}

function genSubset(tab) {
  const tmpSet = new Set();
  for (var i = 0; i < subsets.length; i++) {
    subsets[i].checked = document.querySelector(`#${tab} input[subset-id="${i}"]`).checked;
    if (subsets[i].checked) {
      for (var j of subsets[i].subset) {
        tmpSet.add(j);
      }
    }
  }
  forceMapping = document.querySelector(`#${tab} .force-mapping`).checked;
  ret = [];
  tmpSet.forEach((val) => {
    if (forceMapping && moegirl2bgm[char_index[val].name] === undefined) {
      return;
    }
    ret.push(val);
  });
  return ret;
}

function reset() {
  currentSubset = shuffle(genSubset("tab-score"));
  currentIndex = 0;
  console.log(`new subset generated: length=${currentSubset.length}`);
  ratingHistory = [];
  stat = [];
  for (var i = 0; i < attr_index.length; i++) {
    stat.push({ test: [], test_sum: 0, control: [], control_sum: 0 });
  }
  document.getElementById("ranking-hint").style.display = "block";
  document.getElementById("ranking-table").style.display = "none";
  document.getElementById("ranking-table").getElementsByTagName("tbody")[0].innerHTML = "";
  refresh();
}

function score(val) {
  id = currentSubset[currentIndex];
  console.log(`score ${val} for ${char_index[id].name}`);
  ratingHistory.push({ id: id, score: val });
  for (var i = 0; i < attr_index.length; i++) {
    if (char2map[id].has(i)) {
      stat[i].test.push(val);
      stat[i].test_sum += val;
    } else {
      stat[i].control.push(val);
      stat[i].control_sum += val;
    }
  }
  compute();
  currentIndex++;
  refresh();
}

function skip() {
  if (currentIndex >= currentSubset.length) {
    return;
  }
  id = currentSubset[currentIndex];
  ratingHistory.push({ id: id, score: undefined });
  currentIndex++;
  refresh();
}

function revert() {
  if (ratingHistory.length == 0) {
    return;
  }
  // console.log(ratingHistory);
  const { id, score } = ratingHistory.pop();
  console.log(`revert ${score} for ${char_index[id].name}`);
  if (score !== undefined) {
    for (var i = 0; i < attr_index.length; i++) {
      if (char2map[id].has(i)) {
        stat[i].test.pop();
        stat[i].test_sum -= score;
      } else {
        stat[i].control.pop();
        stat[i].control_sum -= score;
      }
    }
  }
  compute();
  currentIndex--;
  refresh();
}

function compute() {
  const t = Date.now();
  var tmp = "";
  const result = [];
  for (var i = 0; i < attr_index.length; i++) {
    const test = stat[i].test;
    const control = stat[i].control;
    if (test.length === 0 || control.length === 0) {
      rating[i] = undefined;
      continue;
    }
    const avg1 = stat[i].test_sum / test.length;
    const avg2 = stat[i].control_sum / control.length;
    // const [avg1, std1] = normalDist(test);
    // const [avg2, std2] = normalDist(control);
    const delta = avg1 - avg2;
    const countFactor = Math.min(1.8, Math.max(0, Math.log((test.length * control.length) / (test.length + control.length) / 2 + 1) - 0.5));
    // const stdFactor = 1 / (Math.max(2, std1) * Math.max(2, std2));
    const rt = delta * countFactor;
    rating[i] = {
      attr: i,
      rating: rt,
      avg1: avg1,
      // std1: std1,
      n1: test.length,
      avg2: avg2,
      // std2: std2,
      n2: control.length,
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
  for (var i = 0; i < result.length; i++) {
    if (result[i].count <= 2) continue;
    attr = attr_index[result[i].attr];
    var href = "";
    if (attr.article !== undefined) {
      href = ` href="https://zh.moegirl.org.cn/${name2url(attr.article)}"`;
    }
    if (Math.abs(result[i].rating) < 0.05) continue;
    const name = `<a${href} target="_blank">${attr.name}</a>`;
    cnt++;
    tmp += `<tr><th scope="row">${cnt}</th><td>${name}</td>
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
  lastCompute = -1;
  console.log(`Compute finished result.length=${cnt} time=${Date.now() - t}ms`);
}

function predict(subset) {
  var prediction = [];
  for (var ii = 0; ii < subset.length; ii++) {
    const i = subset[ii];
    const scores = [];
    for (attr of char2attr[i]) {
      const rt = rating[attr];
      if (rt !== undefined) {
        scores.push({ rating: rt.rating, attr: attr });
      }
    }
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
      return -a.weight + b.weight;
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
      const tmp3 = attr_index[score.attr].name;
      if (attr_index[score.attr].article !== undefined) {
        tmp2 += `<a href="https://zh.moegirl.org.cn/${name2url(attr_index[score.attr].article)}" target="_blank">${tmp3}</a> `;
      } else {
        tmp2 += tmp3 + " ";
      }
      // tmp2 += `${colorspan2(score.score, -3, 8)} ${colorspan2(score.rating, -3, 8)} ${colorspan(score.weight, 0, 3)}`;
      tmp2 += `${colorspan2(score.score / cur.impsum, -1, 1)}`;
    }
    tmp += `<tr><td>${i + 1}</td>
    <td><a href="https://zh.moegirl.org.cn/${name2url(char_index[cur.id].name)}" target="_blank">${char_index[cur.id].name}</a></td>
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

function normalDist(arr) {
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
  f = Math.max(limit1, Math.min(limit2, val));
  f = (f - limit1) / (limit2 - limit1);
  return `hsl(${(f * 120).toFixed(0)} 80% 70%)`;
}

function colorspan(val, limit1, limit2, center) {
  return `<span style="background-color:${colorize(val, limit1, limit2, center)}">${val.toFixed(2)}</span>`;
}

function colorspan2(val, limit1, limit2) {
  return `<span style="background-color:${colorize2(val, limit1, limit2)}">${val.toFixed(2)}</span>`;
}

function powerWeigh(x, w) {
  if (x > 0) {
    return Math.pow(x, w);
  }
  return -Math.pow(-x, w);
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
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min);
}
