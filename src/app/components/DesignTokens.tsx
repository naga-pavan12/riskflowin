import React from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { CheckCircle2, AlertCircle, XCircle, Info } from 'lucide-react';

export function DesignTokens() {
  return (
    <div className="max-w-7xl space-y-12">
      <div>
        <h1 className="mb-3">Design System</h1>
        <p className="text-[var(--text-secondary)] text-[18px]">
          Apple executive minimal design tokens and component library for RiskInflow Pro
        </p>
      </div>

      {/* Color Palette */}
      <section>
        <h2 className="mb-6">Color Palette</h2>

        <div className="space-y-6">
          {/* Graphite Scale */}
          <div>
            <h3 className="mb-4 text-[var(--text-secondary)]">Graphite Scale</h3>
            <div className="grid grid-cols-8 gap-3">
              {[
                { name: '950', color: 'var(--graphite-950)' },
                { name: '900', color: 'var(--graphite-900)' },
                { name: '850', color: 'var(--graphite-850)' },
                { name: '800', color: 'var(--graphite-800)' },
                { name: '700', color: 'var(--graphite-700)' },
                { name: '600', color: 'var(--graphite-600)' },
                { name: '500', color: 'var(--graphite-500)' },
                { name: '400', color: 'var(--graphite-400)' }
              ].map(({ name, color }) => (
                <Card key={name} className="p-0 overflow-hidden">
                  <div
                    className="h-24"
                    style={{ backgroundColor: color }}
                  />
                  <div className="p-3 text-center">
                    <div className="text-[var(--text-primary)] text-[13px] font-medium">
                      {name}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Accent Colors */}
          <div>
            <h3 className="mb-4 text-[var(--text-secondary)]">Accent Colors</h3>
            <div className="grid grid-cols-4 gap-4">
              {[
                { name: 'Blue', color: 'var(--accent-blue)', use: 'Primary actions' },
                { name: 'Amber', color: 'var(--accent-amber)', use: 'Warnings' },
                { name: 'Red', color: 'var(--accent-red)', use: 'Critical alerts' },
                { name: 'Green', color: 'var(--accent-green)', use: 'Success states' }
              ].map(({ name, color, use }) => (
                <Card key={name} className="p-0 overflow-hidden">
                  <div
                    className="h-32"
                    style={{ backgroundColor: color }}
                  />
                  <div className="p-4">
                    <div className="text-[var(--text-primary)] font-medium mb-1">
                      {name}
                    </div>
                    <div className="text-[var(--text-tertiary)] text-[13px]">
                      {use}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Status Colors */}
          <div>
            <h3 className="mb-4 text-[var(--text-secondary)]">Status Colors (with context)</h3>
            <div className="grid grid-cols-3 gap-4">
              <Card className="p-4 bg-[var(--status-low-bg)] border-[var(--status-low-border)]">
                <div className="flex items-center gap-3 mb-3">
                  <CheckCircle2 className="w-5 h-5 text-[var(--status-low-text)]" />
                  <span className="text-[var(--status-low-text)] font-medium">Low Risk</span>
                </div>
                <p className="text-[var(--text-secondary)] text-[14px]">
                  Icon + label + subtle tint for accessibility
                </p>
              </Card>

              <Card className="p-4 bg-[var(--status-watch-bg)] border-[var(--status-watch-border)]">
                <div className="flex items-center gap-3 mb-3">
                  <AlertCircle className="w-5 h-5 text-[var(--status-watch-text)]" />
                  <span className="text-[var(--status-watch-text)] font-medium">Watch</span>
                </div>
                <p className="text-[var(--text-secondary)] text-[14px]">
                  Requires attention but not critical
                </p>
              </Card>

              <Card className="p-4 bg-[var(--status-severe-bg)] border-[var(--status-severe-border)]">
                <div className="flex items-center gap-3 mb-3">
                  <XCircle className="w-5 h-5 text-[var(--status-severe-text)]" />
                  <span className="text-[var(--status-severe-text)] font-medium">Severe Risk</span>
                </div>
                <p className="text-[var(--text-secondary)] text-[14px]">
                  Immediate action required
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Typography */}
      <section>
        <h2 className="mb-6">Typography</h2>

        <Card className="p-6">
          <div className="space-y-8">
            <div>
              <div className="text-[var(--text-hero)] font-semibold mb-2" style={{ letterSpacing: '-0.02em' }}>
                Hero Display 40px
              </div>
              <div className="text-[var(--text-tertiary)] text-[13px]">
                1–2 max per screen • Semibold 600 • Letter spacing -0.02em
              </div>
            </div>

            <div>
              <div className="text-[var(--text-section)] font-semibold mb-2" style={{ letterSpacing: '-0.01em' }}>
                Section Title 26px
              </div>
              <div className="text-[var(--text-tertiary)] text-[13px]">
                Section headers • Semibold 600 • Letter spacing -0.01em
              </div>
            </div>

            <div>
              <div className="text-[var(--text-title)] font-semibold mb-2">
                Content Title 22px
              </div>
              <div className="text-[var(--text-tertiary)] text-[13px]">
                Card titles, drawer headers • Semibold 600
              </div>
            </div>

            <div>
              <div className="text-[var(--text-body)] mb-2">
                Body Text 16px
              </div>
              <div className="text-[var(--text-tertiary)] text-[13px]">
                Primary reading text • Regular 400 • Line height 1.5
              </div>
            </div>

            <div>
              <div className="text-[14px] text-[var(--text-secondary)] mb-2">
                Secondary Text 14px
              </div>
              <div className="text-[var(--text-tertiary)] text-[13px]">
                Helper text, descriptions • Medium 500
              </div>
            </div>

            <div>
              <div className="text-[13px] text-[var(--text-tertiary)] mb-2">
                Caption Text 13px
              </div>
              <div className="text-[var(--text-tertiary)] text-[13px]">
                Labels, metadata • Medium 500
              </div>
            </div>

            <div>
              <div className="text-[11px] text-[var(--text-tertiary)] uppercase tracking-wide mb-2">
                Micro Text 11px
              </div>
              <div className="text-[var(--text-tertiary)] text-[13px]">
                Timestamps, version info • Uppercase with tracking
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* Spacing Scale */}
      <section>
        <h2 className="mb-6">Spacing Scale</h2>

        <Card className="p-6">
          <div className="space-y-4">
            {[
              { name: 'space-1', value: '4px', usage: 'Tight grouping' },
              { name: 'space-2', value: '8px', usage: 'Related elements' },
              { name: 'space-3', value: '12px', usage: 'Small gaps' },
              { name: 'space-4', value: '16px', usage: 'Default spacing' },
              { name: 'space-6', value: '24px', usage: 'Section spacing' },
              { name: 'space-8', value: '32px', usage: 'Large spacing' },
              { name: 'space-12', value: '48px', usage: 'Major sections' },
              { name: 'space-16', value: '64px', usage: 'Page sections' }
            ].map(({ name, value, usage }) => (
              <div key={name} className="flex items-center gap-6">
                <div className="w-32 text-[var(--text-primary)] font-mono text-[13px]">
                  {name}
                </div>
                <div
                  className="h-8 bg-[var(--accent-blue)]"
                  style={{ width: value }}
                />
                <div className="text-[var(--text-secondary)] text-[14px]">
                  {value} — {usage}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* Components */}
      <section>
        <h2 className="mb-6">Components</h2>

        <div className="space-y-6">
          {/* Buttons */}
          <div>
            <h3 className="mb-4 text-[var(--text-secondary)]">Buttons</h3>
            <Card className="p-6">
              <div className="flex flex-wrap items-center gap-4">
                <Button variant="default">Primary Action</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="link">Link Button</Button>
                <Button variant="default" disabled>Disabled</Button>
              </div>
            </Card>
          </div>

          {/* Badges */}
          <div>
            <h3 className="mb-4 text-[var(--text-secondary)]">Badges</h3>
            <Card className="p-6">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="secondary">Low Risk</Badge>
                <Badge variant="secondary">Watch</Badge>
                <Badge variant="destructive">Severe</Badge>
                <Badge variant="secondary">Neutral</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="default">Default</Badge>
              </div>
            </Card>
          </div>

          {/* Cards */}
          <div>
            <h3 className="mb-4 text-[var(--text-secondary)]">Cards</h3>
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4">
                <h4 className="mb-2">Default Card</h4>
                <p className="text-[var(--text-secondary)] text-[14px]">
                  Base surface with subtle border
                </p>
              </Card>
              <Card className="p-4 rounded-md shadow-sm">
                <h4 className="mb-2">Elevated Card</h4>
                <p className="text-[var(--text-secondary)] text-[14px]">
                  Slightly elevated surface
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Design Principles */}
      <section>
        <h2 className="mb-6">Design Principles</h2>

        <div className="grid grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="mb-4">Whitespace-Led</h3>
            <ul className="space-y-2 text-[var(--text-secondary)] text-[15px]">
              <li>• Generous padding and margins</li>
              <li>• Avoid card soup—use fewer surfaces</li>
              <li>• Let content breathe</li>
              <li>• Subtle dividers over heavy borders</li>
            </ul>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4">Minimal Visual Weight</h3>
            <ul className="space-y-2 text-[var(--text-secondary)] text-[15px]">
              <li>• 2 elevation levels maximum</li>
              <li>• Soft shadows, barely noticeable</li>
              <li>• Consistent 10–12px corner radius</li>
              <li>• 1px borders at low contrast</li>
            </ul>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4">Typography Hierarchy</h3>
            <ul className="space-y-2 text-[var(--text-secondary)] text-[15px]">
              <li>• 1–2 hero metrics maximum</li>
              <li>• Everything else is secondary</li>
              <li>• Tabular numerals for alignment</li>
              <li>• Right-align currency fields</li>
            </ul>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4">Accessible Status</h3>
            <ul className="space-y-2 text-[var(--text-secondary)] text-[15px]">
              <li>• Never rely on color alone</li>
              <li>• Always include icon + label</li>
              <li>• Subtle tints for context</li>
              <li>• Clear visual hierarchy</li>
            </ul>
          </Card>
        </div>
      </section>

      {/* Responsive Breakpoints */}
      <section>
        <h2 className="mb-6">Responsive Frames</h2>

        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-[var(--divider-subtle)]">
              <div>
                <div className="text-[var(--text-primary)] font-medium">Desktop Large</div>
                <div className="text-[var(--text-tertiary)] text-[13px]">Primary experience</div>
              </div>
              <div className="text-[var(--text-secondary)] font-mono">1440px</div>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-[var(--divider-subtle)]">
              <div>
                <div className="text-[var(--text-primary)] font-medium">Desktop Standard</div>
                <div className="text-[var(--text-tertiary)] text-[13px]">Common resolution</div>
              </div>
              <div className="text-[var(--text-secondary)] font-mono">1280px</div>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <div className="text-[var(--text-primary)] font-medium">Tablet</div>
                <div className="text-[var(--text-tertiary)] text-[13px]">Minimum supported</div>
              </div>
              <div className="text-[var(--text-secondary)] font-mono">768px</div>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
