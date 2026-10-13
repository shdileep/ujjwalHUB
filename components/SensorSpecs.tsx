import React from 'react';
import { Waves, Cpu, Radio, Battery, Activity, ShieldCheck, Zap } from 'lucide-react';

interface SensorInfo {
  id: string;
  name: string;
  icon: React.ElementType;
  function: string;
  uses: string;
  realtime: string;
  other: string;
  status: 'online' | 'standby' | 'syncing';
}

const sensors: SensorInfo[] = [
  {
    id: 'ultrasonic',
    name: 'Ultrasonic Sensor',
    icon: Waves,
    function: 'Distance measurement / Fill level detection',
    uses: 'Mounts inside the bin lid to monitor waste volume.',
    realtime: 'Continuous polling via Trigger/Echo pulses.',
    other: 'HC-SR04 variant with 2cm-400cm effective range.',
    status: 'online'
  },
  {
    id: 'esp32',
    name: 'ESP32 Control Unit',
    icon: Cpu,
    function: 'Microcontroller & Data Processing',
    uses: 'Gathers raw data, applies filters, and handles Wi-Fi/BT.',
    realtime: 'WebSocket/MQTT connection to Ujjwal Hub.',
    other: 'Dual-core Xtensa® 32-bit LX6 with deep sleep support.',
    status: 'online'
  },
  {
    id: 'gsm',
    name: 'GSM Module',
    icon: Radio,
    function: 'Cellular Connectivity (Sim800L)',
    uses: 'Failover communication for off-grid bins.',
    realtime: 'HTTP POST / GPRS data transmission.',
    other: 'Quad-band 850/900/1800/1900MHz support.',
    status: 'standby'
  },
  {
    id: 'pmu',
    name: 'PMU (Power Unit)',
    icon: Battery,
    function: 'Energy harvesting & Voltage Regulation',
    uses: 'Solar charging for autonomous 24/7 operation.',
    realtime: 'Battery voltage & charging telemetry.',
    other: 'TP4056 charging circuit with LiPo protection.',
    status: 'online'
  }
];

export const SensorSpecs: React.FC = () => {
  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-8 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-200">
              Hardware Architecture
            </span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
            SMART BIN SENSORS <span className="text-emerald-600">SPECIFICATIONS</span>
          </h1>
          <p className="text-slate-500 font-medium max-w-2xl mt-2">
            Technical breakdown of the IoT stack powering real-time waste monitoring across Chennai municipal zones.
          </p>
        </div>
        
        <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Health</span>
            <span className="text-sm font-bold text-emerald-600 capitalize">All Systems Operational</span>
          </div>
          <div className="w-12 h-12 bg-white rounded-xl border border-slate-100 flex items-center justify-center shadow-sm">
            <Activity className="text-emerald-500 animate-pulse" size={24} />
          </div>
        </div>
      </div>

      {/* Sensor Table */}
      <div className="bg-white rounded-[2rem] shadow-2xl shadow-slate-200 overflow-hidden border border-slate-100">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] w-1/4">Component</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em]">Primary Function</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em]">Real-time Connection</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em]">Deployment</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sensors.map((sensor) => (
                <tr key={sensor.id} className="group hover:bg-slate-50 transition-colors">
                  <td className="px-8 py-8">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform text-slate-900 ring-4 ring-slate-50">
                        <sensor.icon size={28} />
                      </div>
                      <div>
                        <p className="text-lg font-black text-slate-900 leading-none">{sensor.name}</p>
                        <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">{sensor.other.split(' ')[0]}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-8">
                    <p className="text-sm font-bold text-slate-700 leading-relaxed max-w-xs italic">
                      "{sensor.function}"
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400 font-black uppercase tracking-widest bg-slate-100/50 w-fit px-2 py-0.5 rounded-lg border border-slate-200/50">
                      <Zap size={10} className="text-amber-500 fill-amber-500" /> Advanced Logic
                    </div>
                  </td>
                  <td className="px-8 py-8">
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-black text-slate-800 tracking-tight">{sensor.realtime}</p>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600">
                        <Activity size={12} /> Low Latency Pipeline
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-8">
                    <p className="text-sm font-medium text-slate-500 leading-relaxed max-w-xs">
                      {sensor.uses}
                    </p>
                  </td>
                  <td className="px-8 py-8 text-right">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border bg-white shadow-sm overflow-hidden relative">
                      <span className={`w-2 h-2 rounded-full ${
                        sensor.status === 'online' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 
                        sensor.status === 'standby' ? 'bg-amber-400' : 'bg-indigo-500'
                      }`} />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                        {sensor.status}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Technical Footer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-emerald-600 p-8 rounded-[2rem] text-white space-y-4 shadow-xl shadow-emerald-100 flex flex-col justify-between">
          <div>
            <ShieldCheck size={40} className="mb-4 text-emerald-200" />
            <h3 className="text-xl font-black uppercase tracking-tight">Security Protocol</h3>
            <p className="text-sm text-emerald-50 font-medium leading-relaxed opacity-80">
              All sensor data is encrypted at the source using AES-256 before transmission via TLS 1.3 tunnels to the Hub.
            </p>
          </div>
          <button className="w-fit px-6 py-2 bg-white text-emerald-700 font-black rounded-full text-[10px] uppercase tracking-widest hover:bg-emerald-50 transition-colors">
            Security Docs
          </button>
        </div>

        <div className="col-span-1 md:col-span-2 bg-slate-900 p-8 rounded-[2rem] text-white flex flex-col md:flex-row items-center gap-8 overflow-hidden relative">
          <div className="flex-1 space-y-4 z-10">
            <h3 className="text-2xl font-black uppercase tracking-tighter">Real-time Visualization</h3>
            <p className="text-slate-400 text-sm font-medium leading-relaxed">
              Every pulse from the ultrasonic sensor is visualized in real-time on our GIS engine, enabling 
              predictive routing and overflow prevention within seconds.
            </p>
            <div className="flex items-center gap-4 pt-4 border-t border-slate-800">
              <div>
                <p className="text-3xl font-black text-emerald-500 leading-none">99.8%</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Uptime</p>
              </div>
              <div className="w-px h-8 bg-slate-800" />
              <div>
                <p className="text-3xl font-black text-indigo-400 leading-none">&lt;2s</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Latency</p>
              </div>
            </div>
          </div>
          <div className="hidden md:block absolute -right-12 -bottom-12 opacity-20">
            <Cpu size={240} className="text-white" />
          </div>
        </div>
      </div>
    </div>
  );
};
