"use strict";
(() => {
const $ = id => document.getElementById(id);
const names = {HAN:"Hà Nội",SGN:"TP. Hồ Chí Minh",DAD:"Đà Nẵng",PQC:"Phú Quốc",CXR:"Nha Trang",DLI:"Đà Lạt"};
const cityDescriptions = {
 HAN:["MIỀN BẮC · MỘT NGÀY THẬT CHẬM","Phố cổ, hồ Gươm và những buổi sáng chậm rãi."],
 SGN:["MIỀN NAM · THÀNH PHỐ KHÔNG NGỦ","Nhịp sống sôi động, quán nhỏ và món ngon miền Nam."],
 DAD:["MIỀN TRUNG · BIỂN XANH ĐÓN NẮNG","Biển xanh, cầu Rồng và những chuyến đi thong thả."],
 PQC:["ĐẢO NGỌC · BIỂN XANH CÁT TRẮNG","Bãi cát mịn, hoàng hôn biển ngọc và hải sản tươi."],
 CXR:["NAM TRUNG BỘ · VỊNH BIỂN RỰC RỠ","Vịnh biển rực nắng, bãi cát dài và hải trình đảo."],
 DLI:["TÂY NGUYÊN · THÀNH PHỐ NGÀN HOA","Không khí se lạnh, đồi thông mờ sương và góc quán yên bình."]
};
const templates = [
 {code:"MA101",icon:"A",airline:"Hãng mẫu A",start:"07:00",end:"09:10",price:890000},
 {code:"MB203",icon:"B",airline:"Hãng mẫu B",start:"10:20",end:"12:30",price:1090000},
 {code:"MA305",icon:"A",airline:"Hãng mẫu A",start:"14:15",end:"16:25",price:1290000},
 {code:"MC407",icon:"C",airline:"Hãng mẫu C",start:"18:05",end:"20:15",price:1490000}
];
let search = null;
let selected = {outbound:null,inbound:null};
let requestKey = null;
let busy = false;
let serverReady = false;
let promoApplied = false;
const brand = {
  primary: "Bảnh Fuli",
  service: "Bay Cùng Bảnh – Bay Cùng Bố",
  serviceKey: "bay-cung-banh",
};
function applyBrand() {
  document.title = `${brand.primary} — ${brand.service}`;
  document.querySelector('meta[name="description"]').content =
    `Dự án giao diện tìm chuyến bay minh họa ${brand.service}, thương hiệu ${brand.primary}. Giá và lịch trình chưa phải dữ liệu đặt chỗ thật.`;
  const headerBrand = document.querySelector("header .brand > span:last-child");
  headerBrand.childNodes[0].nodeValue = brand.primary.toUpperCase();
  headerBrand.querySelector("small").textContent = brand.service.toUpperCase();
  document.querySelector("footer .brand").textContent = brand.primary.toUpperCase();
  document.querySelector("#about p:not(.eyebrow)").textContent =
    `Dự án giao diện tìm chuyến bay minh họa ${brand.service}, thương hiệu ${brand.primary}, ưu tiên thao tác rõ ràng và trải nghiệm trên điện thoại.`;
  document.querySelector("#promo-dialog .eyebrow").textContent =
    `${brand.primary.toUpperCase()} / ${brand.service.toUpperCase()}`;
  document.querySelector("#promo-description").textContent =
    `Mã BANHFULI10 giảm 10% trên giá chuyến bay mẫu. Đây chỉ là ưu đãi minh họa, không áp dụng thanh toán thật.`;
}
applyBrand();
const localDate = (d=new Date()) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const dateLabel = value => value.split("-").reverse().join("/");
const money = value => new Intl.NumberFormat("vi-VN").format(value)+"đ";
const displayedPrice = value => promoApplied ? Math.round(value * 0.9) : value;
const trip = () => document.querySelector('input[name="trip"]:checked').value;
const text = (tag,cls,value) => {const e=document.createElement(tag); e.className=cls; e.textContent=value; return e;};
const go = id => $(id).scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"start"});
const today=localDate(); const later=new Date(); later.setDate(later.getDate()+3);
$("departure").value=today; $("departure").min=today; $("return-date").value=localDate(later);
$("request-departure").min=today; $("request-departure").value=today; $("request-return").min=today;
function syncReturn(){const round=trip()==="roundtrip"; const min=$("departure").value||localDate(); $("return-field").hidden=!round; $("return-date").disabled=!round; $("return-date").required=round; $("return-date").min=min; if(!$("return-date").value||$("return-date").value<min) $("return-date").value=min;}
function invalidate(){
 search=null;selected={outbound:null,inbound:null};
 $("results").querySelectorAll(".flight-row").forEach(row=>row.classList.remove("selected"));
 $("results").querySelectorAll(".price-button").forEach(button=>button.setAttribute("aria-pressed","false"));
 $("results").hidden=true;$("selection").hidden=true;$("search-error").hidden=true;
}
$("search-form").addEventListener("input",invalidate);
$("search-form").addEventListener("change",()=>{syncReturn();invalidate();});
$("swap").addEventListener("click",()=>{const previous=$("origin").value; $("origin").value=$("destination").value; $("destination").value=previous; invalidate();});
function showSearchError(message){$("search-error").textContent=message; $("search-error").hidden=false;}
function sameDayValid(outbound,inbound){return !outbound||!inbound||inbound.date>outbound.date||(inbound.date===outbound.date&&inbound.start>=outbound.end);}
function renderList(id,from,to,date,leg){
 const container=$(id); container.replaceChildren();
 const flights=[...templates].sort((a,b)=>$("sort").value==="time"?a.start.localeCompare(b.start):a.price-b.price);
 flights.forEach(f=>{
 const flight={...f,from,to,date}; const row=document.createElement("article"); row.className="flight-row";
 const route=document.createElement("div");route.className="route";
 const a=document.createElement("div");a.append(text("div","city",names[from]),text("div","time",f.start));
 const b=document.createElement("div");b.append(text("div","city",names[to]),text("div","time",f.end));
 route.append(a,text("div","arrow","→"),b);
 const info=document.createElement("div");const airline=document.createElement("div");airline.className="airline";airline.title=f.airline;airline.append(text("span","airline-icon",f.icon),text("span","",f.code));info.append(text("div","flight-date",dateLabel(date)),airline);
 const price=displayedPrice(f.price);
 const action=document.createElement("div");const button=document.createElement("button");button.type="button";button.className="price-button";button.textContent=money(price);button.setAttribute("aria-pressed","false");button.setAttribute("aria-label",`Chọn ${f.code}, ${names[from]} đến ${names[to]}, ${f.start}, ${money(price)}`);
 if(selected[leg]?.code===f.code){row.classList.add("selected");button.setAttribute("aria-pressed","true");}
 button.addEventListener("click",()=>{
 const outbound=leg==="outbound"?flight:selected.outbound;const inbound=leg==="inbound"?flight:selected.inbound;
 if(!sameDayValid(outbound,inbound)){ $("live-status").textContent="Không thể chọn: giờ về phải sau hoặc bằng giờ đến của chuyến đi.";showSearchError("Chuyến về đang chọn khởi hành trước khi chuyến đi đến nơi. Hãy chọn giờ khác hoặc đổi ngày về.");go("search-error");return; }
 $("search-error").hidden=true;selected[leg]=flight;container.querySelectorAll(".flight-row").forEach(e=>e.classList.remove("selected"));container.querySelectorAll(".price-button").forEach(e=>e.setAttribute("aria-pressed","false"));row.classList.add("selected");button.setAttribute("aria-pressed","true");renderSelection();showFlightDetails(flight,leg);$("live-status").textContent=`Đã chọn ${leg==="outbound"?"chiều đi":"chiều về"} ${f.code}, ${f.start}.`;
 });action.append(button,text("div","price-note",promoApplied?"Giá mẫu · đã áp dụng mã":"Giá mẫu / người / chặng"));row.append(route,info,action);container.append(row);
 });
}
function showFlightDetails(flight,leg){
 const details=$("flight-confirmation");
 details.replaceChildren();
 const route=text("p","confirmation-route",`${names[flight.from]} → ${names[flight.to]}`);
 const list=document.createElement("dl");
 const values=[
  ["Mã chuyến",flight.code],
  ["Chặng",leg==="outbound"?"Chiều đi":"Chiều về"],
  ["Khởi hành",`${flight.start} · ${dateLabel(flight.date)}`],
  ["Đến nơi",flight.end],
  ["Hành khách",`${search.passengers} người lớn`],
  ["Giá minh họa/chặng",money(displayedPrice(flight.price))]
 ];
 values.forEach(([label,value])=>{
  const row=document.createElement("div");
  row.append(text("dt","",label),text("dd","",value));
  list.append(row);
 });
 details.append(route,list);
 $("flight-dialog").showModal();
}
function renderSelection(){
 const details=$("selection-details");details.replaceChildren();
 for(const [leg,label] of [["outbound","Đi"],["inbound","Về"]]){const f=selected[leg];if(f)details.append(text("p","",`${label}: ${names[f.from]} → ${names[f.to]} · ${dateLabel(f.date)} · ${f.start} · ${f.code}`));}
 const complete=!!selected.outbound&&(search.trip==="oneway"||!!selected.inbound);
 const total=(displayedPrice(selected.outbound?.price||0)+displayedPrice(selected.inbound?.price||0))*search.passengers;
 $("selection-total").textContent=`${complete?"Tổng giá minh họa":"Tạm tính chặng đã chọn"}: ${money(total)} / ${search.passengers} người lớn${promoApplied?" · đã gồm giảm 10% minh họa":""}`;
 $("use-selection").disabled=!complete;$("selection").hidden=false;
}
function renderSearch(){
 if(!search)return;
 renderList("outbound-list",search.from,search.to,search.departure,"outbound");
 const round=search.trip==="roundtrip";$("inbound-section").hidden=!round;$("inbound-list").replaceChildren();
 if(round)renderList("inbound-list",search.to,search.from,search.returnDate,"inbound");
 if(window.anime&&!matchMedia("(prefers-reduced-motion: reduce)").matches)window.anime.animate(".flight-row",{opacity:[0,1],translateY:[12,0],delay:window.anime.stagger(65),duration:420,ease:"outQuad"});
 $("result-caption").textContent=`${names[search.from]} → ${names[search.to]} · ${round?"Khứ hồi":"Một chiều"} · ${search.passengers} người lớn · ${dateLabel(search.departure)}`;
 $("results").hidden=false;
 if(selected.outbound)$("selection").hidden=false,renderSelection();
}
$("search-form").addEventListener("submit",event=>{
 event.preventDefault();$("departure").min=localDate();if(!$("search-form").reportValidity())return;
 if($("origin").value===$("destination").value){showSearchError("Điểm đi và điểm đến phải khác nhau.");return;}
 if(trip()==="roundtrip"&&$("return-date").value<$("departure").value){showSearchError("Ngày về không được trước ngày đi.");return;}
 search={from:$("origin").value,to:$("destination").value,departure:$("departure").value,returnDate:$("return-date").value,passengers:Number($("passengers").value),trip:trip()};
 selected={outbound:null,inbound:null};$("selection").hidden=true;$("search-error").hidden=true;renderSearch();go("results");
});
$("sort").addEventListener("change",renderSearch);
$("use-selection").addEventListener("click",()=>{
 if(!search)return;
 $("request-origin").value=search.from;$("request-destination").value=search.to;$("request-departure").value=search.departure;$("request-return").value=search.trip==="roundtrip"?search.returnDate:"";$("request-return").min=search.departure;$("request-passengers").value=search.passengers;
 requestKey=null;go("ticket-request");$("request-status").textContent="Đã điền hành trình. Hãy bổ sung tên, số điện thoại và xác nhận đồng ý. Mã chuyến mẫu và giá mẫu không được gửi như báo giá.";
});
let activeCity="";
const destinationDialog=$("destination-dialog");
document.querySelectorAll("[data-city]").forEach(button=>button.addEventListener("click",()=>{
 activeCity=button.dataset.city;
 $("destination-dialog-title").textContent=names[activeCity];
 $("destination-region").textContent=cityDescriptions[activeCity][0];
 $("destination-description").textContent=cityDescriptions[activeCity][1];
 destinationDialog.showModal();
}));
$("destination-search").addEventListener("click",()=>{
 $("destination").value=activeCity;
 if($("origin").value===activeCity)$("origin").value=activeCity==="HAN"?"SGN":"HAN";
 invalidate();destinationDialog.close();go("search");$("departure").focus({preventScroll:true});
});
$("floating-search").addEventListener("click",()=>go("search"));
if("IntersectionObserver" in window){
 const visibleCtaSections=new Set();
 const searchCtaObserver=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{
   if(entry.isIntersecting)visibleCtaSections.add(entry.target);
   else visibleCtaSections.delete(entry.target);
  });
  $("floating-search").hidden=visibleCtaSections.size>0;
 },{threshold:.1});
 searchCtaObserver.observe($("search"));
 searchCtaObserver.observe($("destinations"));
}
// Thông báo chỉ lưu tùy chọn trên trình duyệt, không gửi ra ngoài.
const dialog=$("promo-dialog");const key=`${brand.serviceKey}-promo-dismissed`;let promoTimer;
function openPromo(){clearTimeout(promoTimer);if(!dialog.open){dialog.showModal();document.body.classList.add("modal-open");}}
function closePromo(){if($("hide-promo")?.checked){try{sessionStorage.setItem(key,"yes");}catch{}}dialog.close();}
dialog.addEventListener("close",()=>document.body.classList.remove("modal-open"));dialog.addEventListener("cancel",event=>{event.preventDefault();closePromo();});
$("close-promo").addEventListener("click",closePromo);$("open-promo").addEventListener("click",openPromo);$("footer-promo").addEventListener("click",openPromo);$("promo-action").addEventListener("click",()=>{
 promoApplied=true;
 $("promo-note").textContent="Đã áp dụng BANHFULI10: giảm 10% trên giá chuyến bay minh họa. Mã không tạo ưu đãi hoặc thanh toán thật.";
 $("promo-note").hidden=false;
 if(search)renderSearch();
 closePromo();go("search");
});
document.querySelectorAll("dialog.site-dialog").forEach(modal=>modal.addEventListener("click",event=>{if(event.target===modal)modal.close();}));
$("close-flight-dialog").addEventListener("click",()=>$("flight-dialog").close());
let hidden=false;try{hidden=sessionStorage.getItem(key)==="yes";}catch{}
if(!hidden)promoTimer=setTimeout(()=>{const el=document.activeElement;if(el===document.body||!el)openPromo();},1300);
if(window.anime&&!matchMedia("(prefers-reduced-motion: reduce)").matches){
 const {animate,stagger}=window.anime;
 animate(".hero .eyebrow, .hero h1, .hero-copy, .hero .button, .hero-notes",{opacity:[0,1],translateY:[16,0],delay:stagger(75),duration:560,ease:"outQuad"});
 animate(".hero-art__sun, .hero-art__ridge, .hero-art__water, .hero-art__stamp",{opacity:[0,1],translateY:[12,0],delay:stagger(90),duration:760,ease:"outQuad"});
 if("IntersectionObserver" in window){
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add("visible");animate(entry.target,{opacity:[0,1],translateY:[18,0],duration:520,ease:"outQuad"});observer.unobserve(entry.target);}}),{threshold:.08});
  document.documentElement.classList.add("motion-enabled");
  document.querySelectorAll(".reveal").forEach(e=>observer.observe(e));
 }
}
// Lưu yêu cầu thực trên máy chủ cùng nguồn. Không có endpoint ngoài.
async function checkServer(){
 const disableRequestForm=()=>{$("request-form").querySelectorAll("input,select,button").forEach(control=>{control.disabled=true;});};
 if(location.protocol==="file:"){disableRequestForm();$("server-status").textContent="Đang mở tệp trực tiếp: xem được giao diện, chưa gửi được yêu cầu. Chạy py server.py rồi mở http://127.0.0.1:8000.";return;}
 if(!["localhost","127.0.0.1"].includes(location.hostname)){disableRequestForm();$("server-status").textContent="Bản Cloudflare Pages này chỉ phục vụ giao diện tĩnh; chưa có backend để lưu yêu cầu. Không nhập thông tin cá nhân vào biểu mẫu này.";$("request-status").textContent="Biểu mẫu tạm tắt trên website tĩnh. Muốn tiếp nhận yêu cầu cần triển khai backend riêng.";return;}
try{const response=await fetch("/api/health",{cache:"no-store"});const result=await response.json();if(!response.ok||result.service!==`${brand.serviceKey}-local`)throw Error();serverReady=true;$("server-status").textContent="Đã kết nối máy chủ. Yêu cầu sẽ được lưu vào SQLite trên máy chạy máy chủ.";$("request-submit").disabled=false;}catch{$("server-status").textContent="Chưa kết nối đúng máy chủ. Hãy chạy py server.py và truy cập http://127.0.0.1:8000.";}
}
$("request-departure").addEventListener("change",()=>{$("request-return").min=$("request-departure").value||localDate();});
// Mọi thay đổi, kể cả select và checkbox, phải tạo mã chống trùng mới.
// Sự kiện `input` không luôn chạy khi người dùng đổi một phần tử select.
const resetRequestKey=()=>{requestKey=null;};
$("request-form").addEventListener("input",resetRequestKey);
$("request-form").addEventListener("change",resetRequestKey);
$("request-form").addEventListener("submit",async event=>{
 event.preventDefault();if(busy||!serverReady)return;$("request-departure").min=localDate();if(!$("request-form").reportValidity())return;
 const f=new FormData($("request-form"));const payload={name:f.get("name").trim(),phone:f.get("phone").trim(),origin:f.get("origin"),destination:f.get("destination"),departureDate:f.get("departureDate"),returnDate:f.get("returnDate")||null,passengers:Number(f.get("passengers")),consent:f.get("consent")==="on"};
 if(payload.origin===payload.destination){$("request-status").textContent="Điểm đi và điểm đến phải khác nhau.";return;}
 if(payload.returnDate&&payload.returnDate<payload.departureDate){$("request-status").textContent="Ngày về không được trước ngày đi.";return;}
 if(!requestKey){const bytes=new Uint8Array(16);crypto.getRandomValues(bytes);requestKey=Array.from(bytes,b=>b.toString(16).padStart(2,"0")).join("");}payload.requestKey=requestKey;
 busy=true;$("request-submit").disabled=true;$("request-status").textContent="Đang lưu yêu cầu…";
 try{const response=await fetch("/api/requests",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});const result=await response.json().catch(()=>({}));if(!response.ok||!result.reference)throw Error(result.error||"Máy chủ trả về phản hồi không hợp lệ.");$("request-status").textContent=`Đã lưu yêu cầu ${result.reference}. Đây là mã tiếp nhận, chưa phải mã đặt chỗ. Chưa có thông báo tự động gửi tới người quản lý.`;$("request-form").reset();requestKey=null;}catch(error){$("request-status").textContent=error.message+" Nếu kết nối bị gián đoạn, hãy bấm gửi lại mà không sửa thông tin; máy chủ dùng mã yêu cầu để tránh lưu trùng.";}finally{busy=false;$("request-submit").disabled=!serverReady;}
});
syncReturn();search={from:"HAN",to:"SGN",departure:today,returnDate:localDate(later),passengers:1,trip:"oneway"};renderSearch();checkServer();
})();
