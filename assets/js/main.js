const subsets = [
  { name: "*", display: "全部", checked: false },
  { name: "bgm200_subset", display: "Bangumi top 200", checked: true },
  { name: "bgm2000_subset", display: "Bangumi top 2000", checked: false },
  { name: "bgm20000_subset", display: "Bangumi top 20000", checked: false },
  { name: "kyoani_subset", display: "京阿尼合集", checked: false },
  { name: "touhou_new_subset", display: "东方project新作", checked: false },
  { name: "touhou_old_subset", display: "东方project旧作", checked: false },
  { name: "toaru_subset", display: "魔禁(超炮)系列", checked: false },
  { name: "arknights_subset", display: "明日方舟", checked: false },
  { name: "genshin_subset", display: "原神", checked: false },
  { name: "fate_subset", display: "Fate系列", checked: false },
  { name: "jojo_subset", display: "JOJO系列", checked: false },
  { name: "gundam_subset", display: "高达系列", checked: false },
  { name: "naruto_subset", display: "火影忍者", checked: false },
  { name: "furry_subset", display: "兽娘属性", checked: false },
  { name: "lovelive_subset", display: "LoveLive!系列", checked: false },
  { name: "zzzyt_subset", display: "Zzzyt私货(测试用)", checked: false },
];

var currentIndex = 0;
var currentSubset = [];

var char_index, attr_index, char2attr;
var moegirl2bgm;
var char2id = new Map();
var ratingHistory = [];
var stat = [];

var fetchMain = fetch("data/data_min.json")
  .then((response) => response.json())
  .then((data) => {
    ({ char_index, attr_index, char2attr } = data);
    for (var i = 0; i < char_index.length; i++) {
      char2id.set(char_index[i].name, i);
      char2attr[i] = new Set(char2attr[i]);
    }
    for (var i = 0; i < attr_index.length; i++) {
      stat.push({ test: [], test_sum: 0, control: [], control_sum: 0 });
    }
    console.log(`main data loaded: char_index.length=${char_index.length} attr_index.length=${attr_index.length}`);
  });

var fetchMap = fetch("data/moegirl2bgm.json")
  .then((response) => response.json())
  .then((data) => {
    moegirl2bgm = data;
    console.log(`mapping loaded: moegirl2bgm.length=${Object.keys(moegirl2bgm).length}`);
  });

var fetchSubset = [];
for (var i = 1; i < subsets.length; i++) {
  const subid = i;
  fetchSubset.push(
    fetch(`data/subsets/${subsets[i].name}.json`).then((response) => {
      if (!response.ok) {
        console.log(`Subset ${subsets[subid].name} not loaded: ${response.status}`);
        subsets[subid].display += ' <span style="color:red;">ERROR</span>';
        subsets[subid].subset = [];
      } else {
        return response.json().then((data) => {
          subsets[subid].subset = data;
          console.log(`Subset ${subsets[subid].name} loaded: length=${data.length}`);
        });
      }
    })
  );
}

Promise.all([Promise.all(fetchSubset), fetchMain, fetchMap]).then(() => {
  displaySubsets();
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
    <input class="form-check-input" type="checkbox" id="subset-${i}" ${subsets[i].checked ? "checked" : ""} />
    ${subsets[i].display} (${cnt}/${subsets[i].subset.length}) </label>
    </div>`;
  }
  const div = document.getElementById("subset-div");
  div.innerHTML = tmpHtml + div.innerHTML;
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
  // document.getElementById("char-avatar").setAttribute("src", `https://api.bgm.tv/v0/characters/${id}/image?type=small`);
  // document.getElementById("char-image").src = `https://api.bgm.tv/v0/characters/${id}/image?type=large`;
  // document.getElementById("bangumi-link").href = `https://bgm.tv/character/${id}`;
}

function reset() {
  const tmpSet = new Set();
  for (var i = 0; i < subsets.length; i++) {
    subsets[i].checked = document.getElementById(`subset-${i}`).checked;
    if (subsets[i].checked) {
      for (var j of subsets[i].subset) {
        tmpSet.add(j);
      }
    }
  }
  forceMapping = document.getElementById("force-mapping").checked;
  currentSubset = [];
  tmpSet.forEach((val) => {
    if (forceMapping && moegirl2bgm[char_index[val].name] === undefined) {
      return;
    }
    currentSubset.push(val);
  });
  currentSubset = shuffle(currentSubset);
  currentIndex = 0;
  console.log(`new subset generated: length=${currentSubset.length}`);
  ratingHistory = [];
  stat = [];
  for (var i = 0; i < attr_index.length; i++) {
    stat.push({ test: [], test_sum: 0, control: [], control_sum: 0 });
  }
  document.getElementById("ranking-table").innerHTML = "";
  refresh();
}

function score(val) {
  id = currentSubset[currentIndex];
  console.log(`score ${val} for ${char_index[id].name}`);
  ratingHistory.push({ id: id, score: val });
  for (var i = 0; i < attr_index.length; i++) {
    if (char2attr[id].has(i)) {
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
  console.log(ratingHistory);
  const { id, score } = ratingHistory.pop();
  console.log(`revert ${score} for ${char_index[id].name}`);
  if (score !== undefined) {
    for (var i = 0; i < attr_index.length; i++) {
      if (char2attr[id].has(i)) {
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
    if (test.length === 0 || control.length === 0) continue;
    const avg1 = stat[i].test_sum / test.length;
    const avg2 = stat[i].control_sum / control.length;
    // const [avg1, std1] = normalDist(test);
    // const [avg2, std2] = normalDist(control);
    const delta = avg1 - avg2;
    const countFactor = Math.min(1.8, Math.max(0, Math.log((test.length * control.length) / (test.length + control.length) / 2 + 1) - 0.5));
    // const stdFactor = 1 / (Math.max(2, std1) * Math.max(2, std2));
    const rating = delta * countFactor;
    result.push({
      attr: i,
      rating: rating,
      extra: {
        avg1: avg1,
        // std1: std1,
        n1: test.length,
        avg2: avg2,
        // std2: std2,
        n2: control.length,
        delta: delta,
        countFactor: countFactor,
        // stdFactor: stdFactor,
      },
    });
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
    <td style="background: ${colorize(result[i].rating, 4)};">${result[i].rating.toFixed(2)}</td>
    <td>${result[i].extra.avg1.toFixed(2)}/${result[i].extra.n1}
      <span style="background-color:${colorize(result[i].extra.delta, 3)};">${result[i].extra.delta.toFixed(2)}</span>
      <span style="background-color:${colorize(result[i].extra.countFactor, 1.8)};">${result[i].extra.countFactor.toFixed(2)}</span>
    </td>
    </tr>`;
  }
  document.getElementById("ranking-table").innerHTML = tmp;
  lastCompute = -1;
  console.log(`Compute finished result.length=${cnt} time=${Date.now() - t}ms`);
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

function colorize(val, limit) {
  var f = Math.min(limit, Math.max(-limit, val)) / limit;
  if (f > 0) {
    return `hsl(120 80% ${(100 - f * 50).toFixed(0)}%)`;
  } else {
    f = -f;
    return `hsl(0 80% ${(100 - f * 50).toFixed(0)}%)`;
  }
}

function powerWeight(x, w) {
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
