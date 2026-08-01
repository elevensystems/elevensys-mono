import { Button } from '@workspace/ui/components/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@workspace/ui/components/popover';
import { Settings } from 'lucide-react';

interface JsonToolToolbarProps {
  title: string;
  options?: React.ReactNode;
  actions: React.ReactNode;
}

export function JsonToolToolbar({
  title,
  options,
  actions,
}: JsonToolToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-2 py-2">
      {/* Left: title */}
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold">{title}</h1>
      </div>

      {options && (
        <>
          {/* Center: options (desktop) */}
          <div className="hidden lg:flex items-center gap-2">{options}</div>

          {/* Center: settings popover (mobile) */}
          <div className="lg:hidden">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Settings />
                  Settings
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72">
                <div className="flex flex-col gap-3">{options}</div>
              </PopoverContent>
            </Popover>
          </div>
        </>
      )}

      {/* Right: actions */}
      <div className="flex items-center gap-1">{actions}</div>
    </div>
  );
}
