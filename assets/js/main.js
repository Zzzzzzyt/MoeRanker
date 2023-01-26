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
  { name: "zzzyt_subset", display: "Zzzyt私货(测试用)", checked: false },
];

var currentIndex = 0;
var currentSubset = [];

var char_index, attr_index, char2attr;
var moegirl2bgm;
var char2id = new Map();
var rating_history = [];
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
    <input class="form-check-input" type="checkbox" id="subset-${i}" ${subsets[i].checked ? "checked" : ""} />
    <label class="form-check-label" for="flexCheckDefault"> ${subsets[i].display} (${cnt}/${subsets[i].subset.length}) </label>
    </div>`;
  }
  const div = document.getElementById("subset-div");
  div.innerHTML = tmpHtml + div.innerHTML;
  reset();
}

function refresh(id) {
  if (currentIndex >= currentSubset.length) {
    const nameElement = document.getElementById("name");
    nameElement.innerText = "已完全遍历";
    nameElement.href = "https://www.bilibili.com/bangumi/play/ep29854?t=1292";
    document.getElementById("images").innerHTML = `<a id="bangumi-link" href="https://bgm.tv/character/302" target="_blank">
    <img src="assets/img/omedetou.gif" style="max-height:500px;max-width:100%;object-fit:contain"/></a>`;
    return;
  }
  if (id === undefined) {
    id = currentSubset[currentIndex];
  }

  const char = char_index[id];
  const nameElement = document.getElementById("name");
  nameElement.innerText = char.name;
  nameElement.href = "https://zh.moegirl.org.cn/" + name2url(char.name);

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
      tmp += `<a id="bangumi-link" href="https://bgm.tv/character/${j}" target="_blank">
      <img src="https://api.bgm.tv/v0/characters/${j}/image?type=medium" style="max-height:500px;max-width:100%;object-fit:contain"/></a>`;
    }
  } else {
    tmp += `<a id="bangumi-link" href="https://bgm.tv/character/13004" target="_blank">
      <img src="assets/img/akarin.jpg" style="max-height:500px;max-width:100%;object-fit:contain"/></a>`;
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
  rating_history = [];
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
  rating_history.push({ id: id, score: val });
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
  id = currentSubset[currentIndex];
  rating_history.push({ id: id, score: undefined });
  currentIndex++;
  refresh();
}

function revert() {
  if (rating_history.length == 0) {
    return;
  }
  console.log(rating_history);
  const { id, score } = rating_history.pop();
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
  refresh(id);
  currentIndex--;
}

function compute() {
  var tmp = "";
  const result = [];
  for (var i = 0; i < attr_index.length; i++) {
    if (stat[i].test.length === 0 || stat[i].control.length === 0) continue;
    const at = stat[i].test_sum / stat[i].test.length;
    const ac = stat[i].control_sum / stat[i].control.length;
    result.push({ attr: i, rating: at - ac, count: stat[i].test.length });
  }
  result.sort((a, b) => {
    if (b.rating !== a.rating) return b.rating - a.rating;
    return b.attr - a.attr;
  });
  var cnt = 0;
  for (var i = 0; i < result.length; i++) {
    if (result[i].count <= 2) continue;
    attr = attr_index[result[i].attr];
    var href = "";
    if (attr.article !== undefined) {
      href = ` href="https://zh.moegirl.org.cn/${name2url(attr.article)}"`;
    }
    const name = `<a${href} target="_blank">${attr.name}</a>`;
    cnt++;
    tmp += `<tr><th scope="row">${cnt}</th><td>${name}</td><td>${result[i].rating.toFixed(2)}</td><td>${result[i].count}</td></tr>`;
  }
  document.getElementById("ranking-table").innerHTML = tmp;
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
