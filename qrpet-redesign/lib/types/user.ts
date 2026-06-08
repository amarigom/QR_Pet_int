import { ScanWithLocation } from './scan';
import { RecentScan } from './admin';


export interface UserStats {
pets_count: number;
qrs_count: number;
scans_count: number;  
}


export interface UserDashboardStats {
pets_count: number;
qrs_count: number;
scans_count: number;
recent_scans: RecentScan[]; // Podés tiparlo mejor si tenés el ScanResponse
}


