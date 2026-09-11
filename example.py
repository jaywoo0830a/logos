#!/usr/bin/env python3
"""Generate the session graphs for 14D1A (implicit relations) and 16C1A (implicit regions).

Outputs into graphs/0821/14D1A and graphs/0821/16C1A (png).
"""
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Circle as MplCircle, Wedge
import os

plt.rcParams.update({
    'figure.dpi': 200, 'font.size': 11, 'font.family': 'sans-serif',
    'axes.titlesize': 12, 'axes.labelsize': 11,
    'legend.fontsize': 9, 'xtick.labelsize': 8, 'ytick.labelsize': 8,
    'axes.grid': False, 'figure.facecolor': 'white', 'axes.facecolor': 'white',
})
BASE = os.path.join(os.path.dirname(__file__), 'graphs', '0821')
for _sub in ('14D1A', '16C1A'):
    os.makedirs(os.path.join(BASE, _sub), exist_ok=True)

BLUE = '#1a73e8'
RED = '#d93025'
GREEN = '#188038'
AMBER = '#f9ab00'
PURPLE = '#7b1fa2'
GRAY = '#666666'

def save(fig, sub, name):
    fig.savefig(os.path.join(BASE, sub, name), bbox_inches='tight')
    plt.close(fig)

def g(ax):
    ax.grid(True, alpha=0.15, lw=0.4)
    ax.spines['top'].set_visible(False); ax.spines['right'].set_visible(False)

# ═══════════════════════════ 14D1A ═══════════════════════════

def a1_circle_trade():
    """Circle x^2+y^2=25 with tangent at (3,4): slope -x/y, sign stories per quadrant."""
    fig, ax = plt.subplots(figsize=(7.6, 6.8)); g(ax)
    th = np.linspace(0, 2*np.pi, 500)
    ax.plot(5*np.cos(th), 5*np.sin(th), BLUE, lw=2.5, label=r'$x^2+y^2=25$')
    x = np.linspace(1, 5.4, 200)
    ax.plot(x, 4 - 0.75*(x - 3), RED, lw=2.2, ls='--', label=r'tangent: $y-4=-\frac{3}{4}(x-3)$')
    ax.plot([3], [4], 'o', color=RED, ms=8, zorder=6)
    ax.annotate(r'$\frac{dy}{dx}=-\frac{x}{y}=-\frac{3}{4}$', (3, 4), xytext=(1.1, 4.7),
                fontsize=11, color=RED, fontweight='bold',
                arrowprops=dict(arrowstyle='->', color=RED, lw=1.2))
    ax.text(3.1, 2.1, 'fight\n($y\\downarrow$ as $x\\uparrow$)', fontsize=9, color=PURPLE, ha='center')
    ax.text(3.1, -1.5, 'cooperate\n($y\\uparrow$ as $x\\uparrow$)', fontsize=9, color=GREEN, ha='center')
    ax.annotate('vertical tangent\n$y=0$', (5, 0), xytext=(3.2, -3.4), fontsize=9, color=GRAY,
                arrowprops=dict(arrowstyle='->', color=GRAY, lw=1.0))
    ax.set_xlim(-5.8, 6.2); ax.set_ylim(-4.6, 5.6)
    ax.set_aspect('equal')
    ax.set_title('The circle: one formula, four sign stories', fontweight='bold')
    ax.set_xlabel('$x$'); ax.set_ylabel('$y$')
    ax.legend(fontsize=9, loc='upper left')
    fig.tight_layout()
    save(fig, '14D1A', '14d1a-1-circle-trade.png')

def a2_boyle():
    """pV=400 hyperbola with tangent at (100,4): dV/dp = -0.04."""
    fig, ax = plt.subplots(figsize=(8, 5.2)); g(ax)
    p = np.linspace(40, 400, 600)
    V = 400/p
    ax.plot(p, V, BLUE, lw=2.5, label=r'$pV=400$  (isotherm)')
    ax.plot(p, 4 - 0.04*(p - 100), RED, lw=2.2, ls='--', label='tangent at $p=100$')
    ax.plot([100], [4], 'o', color=RED, ms=8, zorder=6)
    ax.annotate(r'$\frac{dV}{dp}=-\frac{V}{p}=-0.04\ \mathrm{m^3/kPa}$', (100, 4),
                xytext=(150, 5.6), fontsize=11, color=RED, fontweight='bold',
                arrowprops=dict(arrowstyle='->', color=RED, lw=1.2))
    ax.annotate('each kPa squeezes out\n$V/p$ cubic meters', (70, 2.4), xytext=(55, 1.4),
                fontsize=10, color=AMBER, fontweight='bold')
    ax.annotate(r'elasticity $E=\frac{p}{V}\frac{dV}{dp}=-1$', (220, 1.3),
                fontsize=11, color=PURPLE, fontweight='bold')
    ax.set_xlim(40, 400); ax.set_ylim(0, 10.5)
    ax.set_title("Boyle's law: the unit-elastic trade", fontweight='bold')
    ax.set_xlabel('pressure $p$ [kPa]'); ax.set_ylabel('volume $V$ [m$^3$]')
    ax.legend(fontsize=9, loc='upper right')
    fig.tight_layout()
    save(fig, '14D1A', '14d1a-2-boyle.png')

def a3_rate_budget():
    """The percentage budget: P'/P + V'/V = T'/T as a bar ledger."""
    fig, ax = plt.subplots(figsize=(9, 4.4)); g(ax)
    labels = [r"$P'/P$", r"$V'/V$", r"$T'/T$"]
    vals = [2.5, -6.7, -4.2]
    colors = [BLUE, AMBER, RED]
    ypos = [2.6, 1.6, 0.6]
    for y, lab, v, col in zip(ypos, labels, vals, colors):
        ax.barh(y, v, height=0.7, color=col, alpha=0.85)
        ax.text(v + (0.3 if v >= 0 else -0.3), y, f'{v:+.1f} %/s',
                va='center', ha='left' if v >= 0 else 'right', fontsize=10, color=col, fontweight='bold')
    ax.set_yticks(ypos); ax.set_yticklabels(labels, fontsize=12)
    ax.axvline(0, color='#333', lw=1.2)
    ax.set_xlim(-9, 4.5)
    ax.set_title(r"Rate budget:  $\frac{P'}{P}+\frac{V'}{V}=\frac{T'}{T}$  — two free, one forced",
                 fontweight='bold')
    ax.text(-8.6, 3.35, 'pressure grows +2.5%/s, volume shrinks 6.7%/s\n→ temperature must fall 4.2%/s',
            fontsize=10, color=GRAY)
    fig.tight_layout()
    save(fig, '14D1A', '14d1a-3-rate-budget.png')

def a4_sphere_tangent_3d():
    """Sphere radius 3, point (1,2,2), radius and tangent velocity (1,1,-1.5)."""
    fig = plt.figure(figsize=(8, 6.8))
    ax = fig.add_subplot(111, projection='3d')
    u = np.linspace(0, 2*np.pi, 48); v = np.linspace(0, np.pi, 48)
    R = 3.0
    xs = R*np.outer(np.cos(u), np.sin(v))
    ys = R*np.outer(np.sin(u), np.sin(v))
    zs = R*np.outer(np.ones_like(u), np.cos(v))
    ax.plot_wireframe(xs, ys, zs, color=BLUE, lw=0.35, alpha=0.55)
    p0 = np.array([1, 2, 2])
    vel = np.array([1, 1, -1.5])
    ax.quiver(0, 0, 0, *p0, color=GRAY, lw=2.2, arrow_length_ratio=0.10)
    ax.quiver(*p0, *vel, color=RED, lw=3, arrow_length_ratio=0.22)
    ax.plot([p0[0]], [p0[1]], [p0[2]], 'o', color=AMBER, ms=9, zorder=6)
    ax.text(1.6, 2.6, 2.6, '$r=(1,2,2)$', fontsize=11, color=GRAY, fontweight='bold')
    ax.text(2.2, 3.2, 0.7, r'$v=(1,1,-\frac{3}{2})$', fontsize=11, color=RED, fontweight='bold')
    ax.text(0, 0, 4.0, r'$r\cdot v=0$  →  motion is tangent to the sphere', fontsize=11,
            color=PURPLE, fontweight='bold', ha='center')
    lim = 3.6
    ax.set_xlim(-lim, lim); ax.set_ylim(-lim, lim); ax.set_zlim(-lim, lim)
    ax.set_box_aspect((1, 1, 1))
    ax.set_axis_off()
    ax.view_init(elev=20, azim=-58)
    ax.set_title('The constraint differentiated: velocity is perpendicular to radius', fontweight='bold')
    fig.tight_layout()
    save(fig, '14D1A', '14d1a-4-sphere-tangent-3d.png')

def a5_folium():
    """Folium x^3+y^3=6xy with tangent at (3,3) and horizontal tangent point."""
    fig, ax = plt.subplots(figsize=(7.6, 6.8)); g(ax)
    t = np.linspace(-3, 3, 3000)
    denom = 1 + t**3
    mask = denom != 0
    t = t[mask]
    x = 6*t/(1 + t**3); y = 6*t**2/(1 + t**3)
    keep = np.abs(x) < 5.4
    ax.plot(x[keep], y[keep], BLUE, lw=2.2, label=r'$x^3+y^3=6xy$')
    xs = np.linspace(1.4, 4.2, 100)
    ax.plot(xs, 3 - 1.0*(xs - 3), RED, lw=2, ls='--', label=r'slope $-1$ at $(3,3)$')
    xh = 2**(4/3); yh = 2**(5/3)
    ax.plot([3, xh], [3, yh], 'o', color=RED, ms=7, zorder=6)
    ax.plot([xh, xh], [0, yh], GRAY, lw=0.9, alpha=0.6, ls=':')
    ax.annotate(r'horizontal tangent $(2^{4/3},\,2^{5/3})$', (xh, yh), xytext=(1.9, 4.3),
                fontsize=10, color=GRAY, fontweight='bold',
                arrowprops=dict(arrowstyle='->', color=GRAY, lw=1.0))
    ax.annotate(r"$y'=\frac{2y-x^2}{y^2-2x}$", (3.3, 0.9), fontsize=12, color=PURPLE, fontweight='bold')
    ax.set_xlim(-5.2, 5.4); ax.set_ylim(-5.0, 4.8)
    ax.set_aspect('equal')
    ax.set_title('The folium: numerator zero = horizontal, denominator zero = vertical', fontweight='bold')
    ax.set_xlabel('$x$'); ax.set_ylabel('$y$')
    ax.legend(fontsize=9, loc='lower left')
    fig.tight_layout()
    save(fig, '14D1A', '14d1a-5-folium.png')

def a6_adiabatic_stiffness():
    """Isotherm pV=300 vs adiabat pV^1.4=300 through (1,300): steeper slope."""
    fig, ax = plt.subplots(figsize=(8, 5.2)); g(ax)
    V = np.linspace(0.55, 3.2, 600)
    iso = 300/V
    adi = 300/V**1.4
    ax.plot(V, iso, BLUE, lw=2.5, label=r'isotherm: $pV=C$')
    ax.plot(V, adi, RED, lw=2.5, label=r'adiabat: $pV^{1.4}=C$')
    Vt = np.linspace(0.7, 1.5, 100)
    ax.plot(Vt, 300 - 300*(Vt - 1), BLUE, lw=1.8, ls='--', alpha=0.8)
    ax.plot(Vt, 300 - 420*(Vt - 1), RED, lw=1.8, ls='--', alpha=0.8)
    ax.plot([1], [300], 'o', color=GRAY, ms=8, zorder=6)
    ax.annotate(r'$-\frac{p}{V}$', (1.42, 300 - 300*0.42), fontsize=10, color=BLUE, fontweight='bold')
    ax.annotate(r'$-\gamma\frac{p}{V}$  ($\gamma=1.4$)', (1.42, 300 - 420*0.42 - 18), fontsize=10,
                color=RED, fontweight='bold')
    ax.annotate('compression heats the gas:\nthe heat shows up as extra steepness', (1.85, 320),
                fontsize=10, color=PURPLE, fontweight='bold')
    ax.set_xlim(0.55, 3.2); ax.set_ylim(0, 580)
    ax.set_title('Same point, two laws: the adiabat is gamma times steeper', fontweight='bold')
    ax.set_xlabel('$V$ [m$^3$]'); ax.set_ylabel('$p$ [kPa]')
    ax.legend(fontsize=9, loc='upper right')
    fig.tight_layout()
    save(fig, '14D1A', '14d1a-6-adiabatic-stiffness.png')

# ═══════════════════════════ 16C1A ═══════════════════════════

def b1_circle_area():
    """Circle x^2+y^2=9 with a vertical slice: solve then integrate."""
    fig, ax = plt.subplots(figsize=(7.4, 6.8)); g(ax)
    th = np.linspace(0, 2*np.pi, 500)
    ax.plot(3*np.cos(th), 3*np.sin(th), BLUE, lw=2.5, label=r'$x^2+y^2=9$')
    x = np.linspace(-3, 3, 400)
    ax.fill_between(x, np.sqrt(9 - x**2), 0, color=BLUE, alpha=0.25)
    xs = 1.2
    ax.fill_between([xs, xs + 0.14], [0, 0], [np.sqrt(9 - xs**2), np.sqrt(9 - xs**2)],
                    color=RED, alpha=0.6)
    ax.annotate(r'slice height $\sqrt{9-x^2}$', (1.35, np.sqrt(9 - 1.44)), xytext=(0.35, 2.6),
                fontsize=10, color=RED, fontweight='bold',
                arrowprops=dict(arrowstyle='->', color=RED, lw=1.1))
    ax.annotate(r'$A=4\int_0^3\sqrt{9-x^2}\,dx=9\pi$', (0, 0), xytext=(-3.4, -3.1),
                fontsize=12, color=PURPLE, fontweight='bold', ha='center')
    ax.set_xlim(-3.9, 3.9); ax.set_ylim(-3.4, 3.6)
    ax.set_aspect('equal')
    ax.set_title('The constraint as a factory: each x manufactures its y', fontweight='bold')
    ax.set_xlabel('$x$'); ax.set_ylabel('$y$')
    fig.tight_layout()
    save(fig, '16C1A', '16c1a-1-circle-area.png')

def b2_isotherm_work():
    """p=800/V with shaded work area from V=2 to 4 = 554.5 kJ."""
    fig, ax = plt.subplots(figsize=(8, 5.2)); g(ax)
    V = np.linspace(1.2, 5.5, 600)
    p = 800/V
    ax.plot(V, p, BLUE, lw=2.5, label=r'$p=\frac{800}{V}$  ($pV=800$)')
    Vs = np.linspace(2, 4, 400)
    ax.fill_between(Vs, 800/Vs, 0, color=BLUE, alpha=0.25)
    ax.axvline(2, color=GRAY, lw=1.2, ls='--'); ax.axvline(4, color=GRAY, lw=1.2, ls='--')
    ax.annotate(r'$W=800\ln 2\approx554.5$ kJ', (2.15, 120), xytext=(2.6, 330),
                fontsize=11, color=RED, fontweight='bold',
                arrowprops=dict(arrowstyle='->', color=RED, lw=1.1))
    ax.annotate('area under the hyperbola\nis a logarithm (10A)', (3.15, 65), fontsize=9,
                color=GRAY, ha='center')
    ax.set_xlim(1.2, 5.5); ax.set_ylim(0, 680)
    ax.set_title('Isotherm work: expand 2→4 m$^3$ under $pV=800$', fontweight='bold')
    ax.set_xlabel('$V$ [m$^3$]'); ax.set_ylabel('$p$ [kPa]')
    ax.legend(fontsize=9, loc='upper right')
    fig.tight_layout()
    save(fig, '16C1A', '16c1a-2-isotherm-work.png')

def b3_ellipse_stretch():
    """Unit circle mapped by (u,v)->(2u,3v): the ellipse is a stretched circle."""
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10.5, 5.2))
    for ax in (ax1, ax2): g(ax)
    th = np.linspace(0, 2*np.pi, 400)
    ax1.plot(np.cos(th), np.sin(th), BLUE, lw=2.5, label=r'$u^2+v^2=1$')
    for u0 in (-0.5, 0.5):
        ax1.axvline(u0, color=GRAY, lw=0.7, alpha=0.5)
        ax1.axhline(u0, color=GRAY, lw=0.7, alpha=0.5)
    ax1.set_xlim(-1.35, 1.35); ax1.set_ylim(-1.35, 1.35)
    ax1.set_aspect('equal')
    ax1.set_title('unit circle (stretch by 2, then by 3)', fontweight='bold')
    ax1.set_xlabel('$u$'); ax1.set_ylabel('$v$')
    ax2.plot(2*np.cos(th), 3*np.sin(th), RED, lw=2.5, label=r'$\frac{x^2}{4}+\frac{y^2}{9}=1$')
    for u0 in (-0.5, 0.5):
        xline = np.linspace(-2*np.sqrt(1 - u0**2), 2*np.sqrt(1 - u0**2), 100)
        ax2.plot(xline, 3*np.sqrt(1 - (xline/2)**2)*np.sign(0.0), color=GRAY, lw=0.7, alpha=0.5)
        yline = np.linspace(-3*np.sqrt(1 - u0**2), 3*np.sqrt(1 - u0**2), 100)
        ax2.plot(2*np.sqrt(1 - (yline/3)**2), yline, color=GRAY, lw=0.7, alpha=0.5)
    ax2.set_xlim(-2.6, 2.6); ax2.set_ylim(-3.6, 3.6)
    ax2.set_aspect('equal')
    ax2.set_title(r'area scales by the stretch factors: $\pi\cdot2\cdot3$', fontweight='bold')
    ax2.set_xlabel('$x$'); ax2.set_ylabel('$y$')
    fig.tight_layout()
    save(fig, '16C1A', '16c1a-3-ellipse-stretch.png')

def b4_logmean():
    """Log-mean rectangle vs midpoint: curve-weighted average."""
    fig, ax = plt.subplots(figsize=(8, 5.2)); g(ax)
    V = np.linspace(1.4, 5.2, 600)
    p = 800/V
    ax.plot(V, p, BLUE, lw=2.5, label=r'$p=800/V$')
    Vs = np.linspace(2, 4, 400)
    ax.fill_between(Vs, 800/Vs, 0, color=BLUE, alpha=0.22)
    pbar = 400*np.log(2)
    ax.add_patch(plt.Rectangle((2, 0), 2, pbar, fill=False, ec=RED, lw=2, ls='--',
                               label=r'$\bar p=400\ln 2\approx277.3$'))
    ax.axhline(300, color=AMBER, lw=1.8, ls=':', label='midpoint 300 (too high)')
    ax.axvline(2, color=GRAY, lw=1.0, alpha=0.6); ax.axvline(4, color=GRAY, lw=1.0, alpha=0.6)
    ax.annotate(r'$W=\bar p\cdot\Delta V$', (2.15, pbar/2), xytext=(3.1, 180), fontsize=11,
                color=RED, fontweight='bold', arrowprops=dict(arrowstyle='->', color=RED, lw=1.0))
    ax.annotate('the hyperbola flattens:\nlow pressure gets more length', (4.35, 80), fontsize=9,
                color=GRAY, ha='center')
    ax.set_xlim(1.4, 5.2); ax.set_ylim(0, 560)
    ax.set_title('Average pressure on an isotherm: the log-mean, not the midpoint', fontweight='bold')
    ax.set_xlabel('$V$ [m$^3$]'); ax.set_ylabel('$p$ [kPa]')
    ax.legend(fontsize=9, loc='upper right')
    fig.tight_layout()
    save(fig, '16C1A', '16c1a-4-logmean.png')

def b5_adiabatic_work():
    """Isotherm vs adiabat from (1,300): shaded areas = work; adiabat sweeps less."""
    fig, ax = plt.subplots(figsize=(8, 5.2)); g(ax)
    V = np.linspace(0.9, 3.2, 600)
    iso = 300/V
    adi = 300/V**(5/3)
    ax.plot(V, iso, BLUE, lw=2.5, label=r'isotherm $pV=300$')
    ax.plot(V, adi, RED, lw=2.5, label=r'adiabat $pV^{5/3}=300$')
    Vs = np.linspace(1, 2, 400)
    ax.fill_between(Vs, adi[Vs*10-9] if False else 300/Vs**(5/3), 0, color=RED, alpha=0.28)
    ax.fill_between(Vs, 300/Vs, 300/Vs**(5/3), color=BLUE, alpha=0.22)
    ax.annotate(r'adiabatic work $\approx166.5$ kJ', (1.18, 70), xytext=(1.45, 210),
                fontsize=10, color=RED, fontweight='bold',
                arrowprops=dict(arrowstyle='->', color=RED, lw=1.0))
    ax.annotate(r'isotherm extra $\approx207.9$ kJ', (1.35, 175), xytext=(2.05, 120),
                fontsize=10, color=BLUE, fontweight='bold',
                arrowprops=dict(arrowstyle='->', color=BLUE, lw=1.0))
    ax.set_xlim(0.9, 3.2); ax.set_ylim(0, 330)
    ax.set_title('Stiffer curve, less area: stiffness turns into energy', fontweight='bold')
    ax.set_xlabel('$V$ [m$^3$]'); ax.set_ylabel('$p$ [kPa]')
    ax.legend(fontsize=9, loc='upper right')
    fig.tight_layout()
    save(fig, '16C1A', '16c1a-5-adiabatic-work.png')

def b6_annulus_and_hemisphere():
    """Left: annulus 4<r<3. Right (3D): hemisphere with a cylindrical slice."""
    fig = plt.figure(figsize=(11, 5.4))
    ax1 = fig.add_subplot(121); g(ax1)
    th = np.linspace(0, 2*np.pi, 500)
    ax1.add_patch(Wedge((0, 0), 3, 0, 360, width=1, fc=AMBER, alpha=0.45, ec=AMBER, lw=1.5))
    ax1.add_patch(MplCircle((0, 0), 2, fill=True, fc='white', ec=GRAY, lw=1.2, alpha=0.9))
    ax1.plot([2], [0], 'o', color=GRAY, ms=5)
    ax1.annotate(r'$A=9\pi-4\pi=5\pi$', (0, 0), xytext=(0, 0.5), fontsize=11, color=PURPLE,
                 fontweight='bold', ha='center')
    ax1.annotate('nested constraints\nnest their integrals', (1.9, 2.35), fontsize=9, color=GRAY, ha='center')
    ax1.set_xlim(-3.4, 3.4); ax1.set_ylim(-3.2, 3.2)
    ax1.set_aspect('equal'); ax1.set_xticks([]); ax1.set_yticks([])
    ax1.set_title(r'The ring: $4\leq x^2+y^2\leq 9$', fontweight='bold')

    ax2 = fig.add_subplot(122, projection='3d')
    u = np.linspace(0, 2*np.pi, 60); v = np.linspace(0, np.pi/2, 60)
    xs = np.outer(np.cos(u), np.sin(v))
    ys = np.outer(np.sin(u), np.sin(v))
    zs = np.outer(np.ones_like(u), np.cos(v))
    ax2.plot_surface(xs, ys, zs, color=BLUE, alpha=0.45, linewidth=0)
    ax2.plot_wireframe(xs[::6, ::6], ys[::6, ::6], zs[::6, ::6], color=BLUE, lw=0.3, alpha=0.6)
    r0 = 0.55
    thc = np.linspace(0, 2*np.pi, 100)
    ax2.plot(r0*np.cos(thc), r0*np.sin(thc), np.sqrt(1 - r0**2)*np.ones_like(thc),
             color=RED, lw=2.5)
    ax2.plot([r0, r0], [0, 0], [0, np.sqrt(1 - r0**2)], color=RED, lw=1.6, ls='--')
    ax2.quiver(0, 0, 0.28, 0, 0, 0.32, color=GRAY, lw=1.4, arrow_length_ratio=0.18)
    ax2.text(0.15, 0.15, 0.72, r'$z=\sqrt{1-x^2-y^2}$', fontsize=10, color=GRAY, fontweight='bold')
    ax2.text(0.6, 0.6, 1.05, r'$r\,dr$ slice', fontsize=10, color=RED, fontweight='bold')
    ax2.text(0, 0, 0.5, r'$V=\frac{2\pi}{3}$', fontsize=11, color=PURPLE, fontweight='bold', ha='center')
    ax2.set_xlim(-1, 1); ax2.set_ylim(-1, 1); ax2.set_zlim(0, 1.1)
    ax2.set_box_aspect((1, 1, 1))
    ax2.set_axis_off()
    ax2.view_init(elev=22, azim=-52)
    ax2.set_title('3D: the same slicing reaches volumes', fontweight='bold')
    fig.tight_layout()
    save(fig, '16C1A', '16c1a-6-annulus-hemisphere.png')

def a0_frame_question():
    """One tangent line, two reciprocal degrees — the frame question picks the driver."""
    fig, ax = plt.subplots(figsize=(7.6, 6.6)); g(ax)
    th = np.linspace(0, 2*np.pi, 500)
    ax.plot(5*np.cos(th), 5*np.sin(th), BLUE, lw=2.5, label=r'$x^2+y^2=25$')
    x = np.linspace(0.5, 5.6, 200)
    ax.plot(x, 4 - 0.75*(x - 3), RED, lw=2.2, ls='--', label='the tangent line')
    ax.plot([3], [4], 'o', color=RED, ms=8, zorder=6)
    ax.annotate(r'driver $x$:  $\frac{dy}{dx}=-\frac{3}{4}$', (3, 4), xytext=(1.0, 4.9),
                fontsize=11, color=RED, fontweight='bold',
                arrowprops=dict(arrowstyle='->', color=RED, lw=1.2))
    ax.annotate(r'driver $y$:  $\frac{dx}{dy}=-\frac{4}{3}$', (3, 4), xytext=(1.0, -2.2),
                fontsize=11, color=PURPLE, fontweight='bold',
                arrowprops=dict(arrowstyle='->', color=PURPLE, lw=1.2))
    ax.text(3.7, 3.1, r'$\frac{dy}{dx}\cdot\frac{dx}{dy}=1$', fontsize=10, color=GRAY, ha='center')
    ax.set_xlim(-5.8, 6.4); ax.set_ylim(-3.2, 5.8)
    ax.set_aspect('equal')
    ax.set_title('One line, two degrees — the frame question picks the driver', fontweight='bold')
    ax.set_xlabel('$x$'); ax.set_ylabel('$y$')
    ax.legend(fontsize=9, loc='upper left')
    fig.tight_layout()
    save(fig, '14D1A', '14d1a-0-frame-question.png')

def b0_two_slicings():
    """Same circle area collected two ways: vertical slices (driver x) vs horizontal (driver y)."""
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(11, 5.2))
    for ax in (ax1, ax2): g(ax)
    th = np.linspace(0, 2*np.pi, 400)
    for ax in (ax1, ax2):
        ax.plot(3*np.cos(th), 3*np.sin(th), BLUE, lw=2.5)
        ax.set_aspect('equal'); ax.set_xlim(-3.5, 3.5); ax.set_ylim(-3.5, 3.5)
    for x0 in (-2.5, -1.25, 0.0, 1.25):
        xw = np.linspace(x0, x0 + 0.9, 60)
        yw = np.sqrt(np.clip(9 - xw**2, 0, None))
        ax1.fill_between(xw, -yw, yw, color=RED, alpha=0.25)
        ax1.plot([x0, x0], [-np.sqrt(9 - x0**2), np.sqrt(9 - x0**2)], color=RED, lw=1.2)
    ax1.text(0, -3.1, r'driver $x$:  $A = \int_{-3}^{3} 2\sqrt{9-x^2}\,dx = 9\pi$',
             fontsize=10, color=RED, fontweight='bold', ha='center')
    ax1.text(-2.95, 2.7, r'$dA = y(x)\,dx$', fontsize=10, color=GRAY)
    ax1.set_title('Vertical slices — $x$ drives', fontweight='bold')
    for y0 in (-2.5, -1.25, 0.0, 1.25):
        yw = np.linspace(y0, y0 + 0.9, 60)
        xw = np.sqrt(np.clip(9 - yw**2, 0, None))
        ax2.fill_betweenx(yw, -xw, xw, color=PURPLE, alpha=0.25)
        ax2.plot([-np.sqrt(9 - y0**2), np.sqrt(9 - y0**2)], [y0, y0], color=PURPLE, lw=1.2)
    ax2.text(0, -3.1, r'driver $y$:  $A = \int_{-3}^{3} 2\sqrt{9-y^2}\,dy = 9\pi$',
             fontsize=10, color=PURPLE, fontweight='bold', ha='center')
    ax2.text(-2.95, 2.7, r'$dA = x(y)\,dy$', fontsize=10, color=GRAY)
    ax2.set_title('Horizontal slices — $y$ drives', fontweight='bold')
    fig.suptitle('One region, two drivers — the same relation collected in either direction',
                 fontweight='bold', fontsize=12)
    fig.tight_layout()
    save(fig, '16C1A', '16c1a-0-two-slicings.png')

if __name__ == '__main__':
    a0_frame_question(); a1_circle_trade(); a2_boyle(); a3_rate_budget()
    a4_sphere_tangent_3d(); a5_folium(); a6_adiabatic_stiffness()
    b0_two_slicings(); b1_circle_area(); b2_isotherm_work(); b3_ellipse_stretch()
    b4_logmean(); b5_adiabatic_work(); b6_annulus_and_hemisphere()
    print('Done: 14D1A + 16C1A graphs written to graphs/0821/')
