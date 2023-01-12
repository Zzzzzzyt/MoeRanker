var currentid = 0;
var char_index, attr_index, char2attr, moegirl_to_bgm;
var weight, count;

fetch("/data/data_min.json")
  .then((response) => response.json())
  .then((data) => {
    console.log("main db loaded:", data);
    char_index = data["char_index"];
    attr_index = data["attr_index"];
    char2attr = data["char2attr"];
    fetch("/data/moegirl_to_bgm.json")
      .then((response) => response.json())
      .then((data) => {
        console.log("mapping loaded:", data);
        moegirl_to_bgm = data;
        weight = new Array(attr_index.length);
        weight.fill(0);
        count = new Array(attr_index.length);
        count.fill(0);
        refresh();
      });
  });

function refresh() {
  currentid = getRandomInt(0, char_index.length);
  char = char_index[currentid];
  var nameElement = document.getElementById("name");
  nameElement.innerText = char.page;
  nameElement.href = "https://zh.moegirl.org.cn" + char.url;
  var src = "/assets/images/" + moegirl_to_bgm[char.page];
  document.getElementById("char-image").setAttribute("src", src + "-large.jpg");
  document.getElementById("char-avatar").setAttribute("src", src + "-avatar.jpg");
}

function scoreManual() {
  score(Number.parseInt(document.getElementById("manual-rating").value));
}

function score(val) {
  console.log(`score ${val} for ${char_index[currentid].page}`);
  for (var i of char2attr[currentid]) {
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
    var rating = weight[i] * count[i];
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
      href = ` href="https://zh.moegirl.org.cn${attr.article.url}`;
    }
    var name = `<a${href} target="_blank">${attr.name}</a>`;
    tmp += `<tr><th scope="row">${i + 1}</th><td>${name}</td><td>${result[i].rating}</td><td>${count[result[i].attr]}</td></tr>`;
  }
  document.getElementById("ranking-table").innerHTML = tmp;
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min);
}
