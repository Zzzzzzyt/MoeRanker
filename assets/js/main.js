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

var currentId = 0;
var currentSubset = [];
var current = [];
var dedupe = true;

var char_index, attr_index, char2attr;
var moegirl2bgm;
var char2id = new Map();
var weight, count;

var fetchMain = fetch("data/data_min.json")
  .then((response) => response.json())
  .then((data) => {
    ({ char_index, attr_index, char2attr } = data);
    for (var i = 0; i < char_index.length; i++) {
      char2id.set(char_index[i].name, i);
    }
    console.log(`main data loaded: char_index.length=${char_index.length} attr_index.length=${attr_index.length}`);
    weight = new Array(attr_index.length);
    weight.fill(0);
    count = new Array(attr_index.length);
    count.fill(0);
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
  current = allSubset;
  subsets[0].subset = allSubset;
  for (var i = 1; i < subsets.length; i++) {
    var tmpSet = new Set();
    for (var j = 0; j < subsets[i].subset.length; j++) {
      const id = char2id.get(subsets[i].subset[j]);
      if (id === undefined) continue;
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
    <input class="form-check-input" type="checkbox" id="subset-${i}" onclick="updateSubset();" ${subsets[i].checked ? "checked" : ""} />
    <label class="form-check-label" for="flexCheckDefault"> ${subsets[i].display} (${cnt}/${subsets[i].subset.length}) </label>
    </div>`;
  }
  const div = document.getElementById("subset-div");
  div.innerHTML = tmpHtml + div.innerHTML;
  updateSubset();
}

function refresh() {
  if (current.length == 0) {
    const nameElement = document.getElementById("name");
    nameElement.innerText = "已完全遍历";
    nameElement.href = "";
    document.getElementById("char-image").setAttribute("src", "");
  }

  const i = getRandomInt(0, current.length);
  currentId = current[i];
  current.splice(i, 1);
  const char = char_index[currentId];
  const nameElement = document.getElementById("name");
  nameElement.innerText = char.name;
  nameElement.href = "https://zh.moegirl.org.cn/" + name2url(char.name);

  const ids = moegirl2bgm[char.name];
  var tmp = "";
  if (ids !== undefined) {
    for (var j of ids) {
      tmp += `<a id="bangumi-link" href="https://bgm.tv/character/${j}" target="_blank">
      <img src="https://api.bgm.tv/v0/characters/${j}/image?type=medium" style="max-height:500px;max-width:100%;object-fit:contain"/></a>`;
    }
  } else {
    tmp += `<a id="bangumi-link" href="https://bgm.tv/character/13004" target="_blank">
      <img src="/assets/img/akarin.jpg" style="max-height:500px;max-width:100%;object-fit:contain"/></a>`;
  }
  document.getElementById("images").innerHTML = tmp;
  // document.getElementById("char-avatar").setAttribute("src", `https://api.bgm.tv/v0/characters/${id}/image?type=small`);
  // document.getElementById("char-image").src = `https://api.bgm.tv/v0/characters/${id}/image?type=large`;
  // document.getElementById("bangumi-link").href = `https://bgm.tv/character/${id}`;
}

function updateSubset() {
  const tmpSet = new Set();
  for (var i = 0; i < subsets.length; i++) {
    subsets[i].checked = document.getElementById(`subset-${i}`).checked;
    if (subsets[i].checked) {
      for (var j of subsets[i].subset) {
        tmpSet.add(j);
      }
    }
  }
  currentSubset = [];
  tmpSet.forEach((val) => {
    currentSubset.push(val);
  });
  current = Array.from(currentSubset);
  console.log(`new subset generated: length=${currentSubset.length}`);
  refresh();
}

function resetDedupe() {
  current = Array.from(currentSubset);
  refresh();
}

function toggleDedupe() {
  var newval = document.getElementById("toggle-dedupe").checked;
  if (newval) {
    resetDedupe();
  }
  dedupe = newval;
}

function scoreManual() {
  score(Number.parseInt(document.getElementById("manual-rating").value));
}

function score(val) {
  console.log(`score ${val} for ${char_index[currentId].name}`);
  for (var i of char2attr[currentId]) {
    weight[i] += val;
    count[i]++;
  }
  // console.log(weight, count);
  compute();
  refresh();
}

function skip() {
  refresh();
}

function compute() {
  var result = [];
  for (var i = 0; i < attr_index.length; i++) {
    if (count[i] === 0) continue;
    const rating = weight[i] * count[i];
    result.push({ rating: rating, attr: i });
  }
  result.sort((a, b) => {
    if (b.rating !== a.rating) return b.rating - a.rating;
    return count[b.attr] - count[a.attr];
  });
  console.log(result);

  var tmp = "";
  for (var i = 0; i < result.length; i++) {
    attr = attr_index[result[i].attr];
    var href = "";
    if (attr.article !== undefined) {
      href = ` href="https://zh.moegirl.org.cn/${name2url(attr.article)}"`;
    }
    const name = `<a${href} target="_blank">${attr.name}</a>`;
    tmp += `<tr><th scope="row">${i + 1}</th><td>${name}</td><td>${result[i].rating}</td><td>${count[result[i].attr]}</td></tr>`;
  }
  document.getElementById("ranking-table").innerHTML = tmp;
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min);
}
