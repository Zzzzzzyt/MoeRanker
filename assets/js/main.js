const subsets = [
  { name: "*", display: "全部" },
  { name: "bgm200_subset", display: "Bangumi top 200" },
  { name: "bgm2000_subset", display: "Bangumi top 2000" },
  { name: "kyoani_subset", display: "京阿尼合集" },
  { name: "touhou_subset", display: "东方project合集" },
  { name: "toaru_subset", display: "魔禁世界观(含超炮)合集" },
];

var currentId = 0;
var currentSubset = [];

var char_index, attr_index, char2attr;
var moegirl2bgm;
var char2id = new Map();
var weight, count;

var fetchMain = fetch("data/data_min.json")
  .then((response) => response.json())
  .then((data) => {
    ({ char_index, attr_index, char2attr } = data);
    for (var i = 0; i < char_index.length; i++) {
      char2id.set(char_index[i].page, i);
    }
    console.log(`main data loaded: char_index.length=${char_index.length} attr_index.length=${attr_index.length}`);
    var weight = new Array(attr_index.length);
    weight.fill(0);
    var count = new Array(attr_index.length);
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
    tmpHtml += `<div class="form-check">
    <input class="form-check-input" type="checkbox" id="subset-${i}" ${i == 0 ? "checked" : ""} />
    <label class="form-check-label" for="flexCheckDefault"> ${subsets[i].display} (${subsets[i].subset.length}) </label>
    </div>`;
  }
  const div = document.getElementById("subset-div");
  div.innerHTML = tmpHtml + div.innerHTML;
}

function refresh() {
  const i = getRandomInt(0, currentSubset.length);
  currentId = currentSubset[i];
  const char = char_index[currentId];
  const nameElement = document.getElementById("name");
  nameElement.innerText = char.page;
  nameElement.href = "https://zh.moegirl.org.cn" + char.url;
  const id = moegirl2bgm[char.page];
  // document.getElementById("char-avatar").setAttribute("src", `https://api.bgm.tv/v0/characters/${id}/image?type=small`);
  document.getElementById("char-image").setAttribute("src", `https://api.bgm.tv/v0/characters/${id}/image?type=large`);
}

function generateSubset() {
  const tmpSet = new Set();
  for (var i = 0; i < subsets.length; i++) {
    const checked = document.getElementById(`subset-${i}`).checked;
    if (checked) {
      for (var j of subsets[i].subset) {
        tmpSet.add(j);
      }
    }
  }
  currentSubset = [];
  tmpSet.forEach((val) => {
    currentSubset.push(val);
  });
  console.log(`new subset generated: length=${currentSubset.length}`);
  refresh();
}

function scoreManual() {
  score(Number.parseInt(document.getElementById("manual-rating").value));
}

function score(val) {
  console.log(`score ${val} for ${char_index[currentId].page}`);
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
      href = ` href="https://zh.moegirl.org.cn${attr.article.url}"`;
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
