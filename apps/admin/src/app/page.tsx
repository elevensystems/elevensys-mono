import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import { Button } from '@workspace/ui/components/button';

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white relative overflow-hidden flex flex-col items-center justify-center p-6">
      {/* Background Gradients */}
      <div className="absolute inset-0 z-0">
        <div className="absolute -top-[40%] -left-[20%] w-[70%] h-[70%] rounded-full bg-violet-600/30 blur-[120px]" />
        <div className="absolute top-[60%] -right-[20%] w-[60%] h-[60%] rounded-full bg-blue-600/20 blur-[120px]" />
      </div>

      <div className="z-10 w-full max-w-5xl space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="space-y-4 text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight bg-gradient-to-br from-white to-white/40 bg-clip-text text-transparent">
            Elevensys Admin
          </h1>
          <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
            Manage your monorepo ecosystem with precision and style. 
            Built on top of Turborepo, Next.js, and shadcn/ui.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white/5 border-white/10 backdrop-blur-xl hover:bg-white/10 hover:border-white/20 transition-all duration-300 group">
            <CardHeader>
              <CardTitle className="text-xl text-white group-hover:text-violet-400 transition-colors">Users</CardTitle>
              <CardDescription className="text-neutral-400">Manage platform access</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-light text-white mb-6">14,203</div>
              <Button className="w-full bg-white text-black hover:bg-neutral-200 transition-colors">
                View Users
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 backdrop-blur-xl hover:bg-white/10 hover:border-white/20 transition-all duration-300 group">
            <CardHeader>
              <CardTitle className="text-xl text-white group-hover:text-blue-400 transition-colors">Revenue</CardTitle>
              <CardDescription className="text-neutral-400">Current MRR metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-light text-white mb-6">$84,105</div>
              <Button className="w-full bg-white text-black hover:bg-neutral-200 transition-colors">
                View Reports
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 backdrop-blur-xl hover:bg-white/10 hover:border-white/20 transition-all duration-300 group">
            <CardHeader>
              <CardTitle className="text-xl text-white group-hover:text-emerald-400 transition-colors">System</CardTitle>
              <CardDescription className="text-neutral-400">Monorepo health</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-light text-emerald-400 mb-6">99.9%</div>
              <Button className="w-full bg-white text-black hover:bg-neutral-200 transition-colors">
                View Logs
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
