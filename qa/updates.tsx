// Browser-only simulation; never installs software or calls native IPC.
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { UpdateSettings, useUpdates } from "../packages/ui/src/UpdateSettings";
import type { UpdateAdapter, UpdateStatus } from "@nuvokit/core";
import "../packages/ui/src/styles.css";
const offer = {token:"synthetic-offer",version:"0.1.4",notes:"Thêm Đồng hồ với ba bố cục và cài đặt giao diện.\nCập nhật được xác minh trước khi cài.",pubDate:null,downloaded:false};
let snapshot:UpdateStatus={currentVersion:"0.1.3",channel:"preview",supported:true,canInstall:true,lastCheckedAt:null,available:{...offer},message:""};
let networkFailure=false,signatureFailure=false,cancelled=false,installCalls=0;
const copy=()=>structuredClone(snapshot), delay=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));
const adapter:UpdateAdapter={
  status:async()=>copy(),
  channel:async channel=>{snapshot={...snapshot,channel,available:channel==="preview"?{...offer}:null,message:channel==="stable"?"Kênh này chưa có bản phát hành.":""};return copy();},
  check:async()=>{await delay(180);if(networkFailure)throw new Error("Không kết nối được nguồn cập nhật. App vẫn dùng được; hãy kiểm tra mạng và thử lại.");snapshot.lastCheckedAt=Math.floor(Date.now()/1000);return copy();},
  download:async(_,progress)=>{cancelled=false;for(let count=0;count<20;count++){await delay(120);if(cancelled)throw new Error("Đã hủy tải cập nhật.");progress({stage:count===19?"verifying":"downloading",downloadedBytes:(count+1)*250_000,totalBytes:5_000_000});}if(signatureFailure)throw new Error("Chữ ký hoặc phiên bản gói cập nhật không hợp lệ. Bản đang dùng được giữ nguyên.");snapshot.available={...offer,downloaded:true};return copy();},
  cancel:async()=>{cancelled=true;},install:async()=>{installCalls++;},
};
function Fixture(){const updates=useUpdates(adapter);const [network,setNetwork]=useState(false),[signature,setSignature]=useState(false),[clock,setClock]=useState(false),[blocked,setBlocked]=useState(false);return <main style={{maxWidth:940,margin:"36px auto",padding:20}}><h1>Cập nhật ứng dụng</h1><p className="note">KIỂM THỬ · DỮ LIỆU GIẢ · Không tải/cài file thật</p><section className="panel" style={{margin:"20px 0",display:"flex",gap:18,flexWrap:"wrap"}}>{[{label:"Lỗi mạng",value:network,set:(value:boolean)=>{networkFailure=value;setNetwork(value);}},{label:"Lỗi chữ ký",value:signature,set:(value:boolean)=>{signatureFailure=value;setSignature(value);}},{label:"Đồng hồ đang chạy",value:clock,set:setClock},{label:"Tác vụ dữ liệu đang bận",value:blocked,set:setBlocked}].map(control=><label key={control.label}><input type="checkbox" checked={control.value} onChange={event=>control.set(event.target.checked)}/>{control.label}</label>)}</section><UpdateSettings updates={updates} blocked={blocked} clockActive={clock}/><output>Lệnh cài giả lập: {installCalls}</output></main>;}
createRoot(document.getElementById("root")!).render(<Fixture/>);
