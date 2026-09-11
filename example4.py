#!/usr/bin/env python3
"""Generate visual graphs for 12A1 Complex Numbers — Matrix-Aware Edition."""
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyArrowPatch, Polygon, Arc, Circle, Wedge
import numpy as np
from mpl_toolkits.mplot3d import Axes3D
import os

OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))
os.makedirs(OUTPUT_DIR, exist_ok=True)

plt.rcParams.update({
    'figure.dpi': 150, 'savefig.dpi': 150,
    'font.size': 11, 'axes.titlesize': 13, 'axes.labelsize': 11,
    'savefig.facecolor': 'white', 'savefig.edgecolor': 'none',
    'figure.facecolor': 'white',
})

def save_fig(fig, name):
    fig.savefig(f'{OUTPUT_DIR}/{name}', bbox_inches='tight', facecolor='white',
                edgecolor='none', pad_inches=0.15)
    plt.close(fig)

# ═══════════════════════════════════════════════════════════
# 01 — Complex Plane: Point, Modulus, Argument
# ═══════════════════════════════════════════════════════════
def fig_01_complex_plane_polar():
    fig, ax = plt.subplots(figsize=(7.5, 7.5))
    z = np.array([3, 2])
    r = np.linalg.norm(z)
    theta = np.arctan2(z[1], z[0])

    # Axes
    ax.axhline(0, color='black', lw=0.8)
    ax.axvline(0, color='black', lw=0.8)

    # Unit circle
    circle = Circle((0,0), 1, fill=False, color='gray', linestyle='--', alpha=0.4, linewidth=1)
    ax.add_patch(circle)

    # Radius circle
    circle_r = Circle((0,0), r, fill=False, color='#3498DB', linestyle=':', alpha=0.5, linewidth=1.5)
    ax.add_patch(circle_r)

    # Vector from origin to z
    ax.arrow(0, 0, z[0], z[1], head_width=0.12, head_length=0.12, fc='#E74C3C', ec='#E74C3C', linewidth=3, zorder=5)

    # Dashed lines to axes
    ax.plot([z[0], z[0]], [0, z[1]], '--', color='gray', alpha=0.5)
    ax.plot([0, z[0]], [z[1], z[1]], '--', color='gray', alpha=0.5)

    # Angle arc
    arc = Arc((0,0), 1.5, 1.5, angle=0, theta1=0, theta2=np.degrees(theta), color='#8E44AD', linewidth=2.5)
    ax.add_patch(arc)

    # Labels
    ax.annotate(f'z = 3+2i', (z[0], z[1]), textcoords="offset points", xytext=(10, 10), fontsize=12, color='#E74C3C', fontweight='bold')
    ax.annotate(f'Re(z)=3', (z[0], -0.25), fontsize=9, color='gray', ha='center')
    ax.annotate(f'Im(z)=2', (-0.45, z[1]), fontsize=9, color='gray', va='center')
    ax.text(1.0, 0.35, f'θ≈{np.degrees(theta):.0f}°', fontsize=11, color='#8E44AD', fontweight='bold')
    ax.text(r/2*np.cos(theta/2)-0.15, r/2*np.sin(theta/2), f'r={r:.2f}', fontsize=10, color='#3498DB')

    ax.set_xlim(-1, 5); ax.set_ylim(-1, 4)
    ax.set_aspect('equal'); ax.grid(True, alpha=0.25)
    ax.set_xlabel('Real axis'); ax.set_ylabel('Imaginary axis')
    ax.set_title('Complex Plane: z = a+bi = (a,b) = re^{iθ}', fontweight='bold', fontsize=14)
    save_fig(fig, '01-complex-plane-polar.png')

# ═══════════════════════════════════════════════════════════
# 02 — i-Powers Cycle on Unit Circle
# ═══════════════════════════════════════════════════════════
def fig_02_i_powers_cycle():
    fig, ax = plt.subplots(figsize=(7, 7))
    circle = Circle((0,0), 1, fill=False, color='gray', linestyle='--', alpha=0.4)
    ax.add_patch(circle)
    ax.axhline(0, color='black', lw=0.5); ax.axvline(0, color='black', lw=0.5)

    powers = [(1,0,'1','#27AE60'), (0,1,'i','#3498DB'), (-1,0,'-1','#E74C3C'), (0,-1,'-i','#F39C12')]
    for i, (x, y, label, color) in enumerate(powers):
        ax.plot(x, y, 'o', color=color, markersize=15, zorder=5)
        offset = [(15,10), (-20,15), (-25,-20), (15,-25)]
        ax.annotate(f'$i^{i}$ = {label}', (x, y), textcoords="offset points",
                    xytext=offset[i], fontsize=12, color=color, fontweight='bold')

    # Arrows showing cycle
    angles = [0, 90, 180, 270]
    for i in range(4):
        t1 = np.radians(angles[i])
        t2 = np.radians(angles[(i+1)%4])
        mid = np.radians(angles[i] + 45)
        ax.annotate('', xy=(np.cos(t2), np.sin(t2)), xytext=(np.cos(t1), np.sin(t1)),
                    arrowprops=dict(arrowstyle='->', color='#8E44AD', lw=2.5,
                                    connectionstyle='arc3,rad=0.3'))

    ax.text(0.25, 0.35, '× i', fontsize=11, color='#8E44AD', fontweight='bold')
    ax.set_xlim(-1.8, 1.8); ax.set_ylim(-1.8, 1.8)
    ax.set_aspect('equal'); ax.grid(True, alpha=0.2)
    ax.set_title('Multiplying by i = 90° Rotation on the Unit Circle', fontweight='bold', fontsize=13)
    save_fig(fig, '02-i-powers-cycle.png')

# ═══════════════════════════════════════════════════════════
# 03 — Conjugate as Reflection Across Real Axis
# ═══════════════════════════════════════════════════════════
def fig_03_conjugate_reflection():
    fig, ax = plt.subplots(figsize=(7, 7))
    z = np.array([3, 2])
    zbar = np.array([3, -2])

    ax.axhline(0, color='black', lw=1.2); ax.axvline(0, color='black', lw=0.5)

    # Real axis highlight
    ax.axhline(0, color='#27AE60', lw=3, alpha=0.2)
    ax.text(4.2, 0.25, 'Real axis = mirror', fontsize=10, color='#27AE60', fontweight='bold')

    # z
    ax.arrow(0,0,z[0],z[1], head_width=0.12, head_length=0.12, fc='#E74C3C', ec='#E74C3C', linewidth=3, zorder=5)
    ax.annotate('z = 3+2i', (z[0],z[1]), textcoords="offset points", xytext=(10,10), fontsize=12, color='#E74C3C', fontweight='bold')

    # zbar
    ax.arrow(0,0,zbar[0],zbar[1], head_width=0.12, head_length=0.12, fc='#3498DB', ec='#3498DB', linewidth=3, zorder=5)
    ax.annotate(r'$\bar{z}$ = 3−2i', (zbar[0],zbar[1]), textcoords="offset points", xytext=(10,-18), fontsize=12, color='#3498DB', fontweight='bold')

    # Dashed vertical connection
    ax.plot([z[0],z[0]],[z[1],zbar[1]], '--', color='gray', alpha=0.6, linewidth=1.5)
    ax.text(z[0]+0.15, 0, '|b|', fontsize=10, color='gray')
    ax.text(z[0]+0.15, z[1]/2, 'same x', fontsize=9, color='gray', alpha=0.7)

    # Mirror icon
    ax.text(4, 1.2, '⟺ Reflection', fontsize=11, color='#27AE60', fontweight='bold',
            bbox=dict(boxstyle='round', facecolor='#D5F5E3', alpha=0.7))

    ax.set_xlim(-1, 5.5); ax.set_ylim(-3.5, 3.5)
    ax.set_aspect('equal'); ax.grid(True, alpha=0.2)
    ax.set_xlabel('Real'); ax.set_ylabel('Imaginary')
    ax.set_title('Conjugate = Reflection Across the Real Axis', fontweight='bold', fontsize=14)
    save_fig(fig, '03-conjugate-reflection.png')

# ═══════════════════════════════════════════════════════════
# 04 — Complex Addition = Vector Addition (Parallelogram)
# ═══════════════════════════════════════════════════════════
def fig_04_complex_addition():
    fig, ax = plt.subplots(figsize=(7.5, 7))
    z1 = np.array([2, 1])
    z2 = np.array([1, 3])
    zsum = z1 + z2

    ax.axhline(0, color='black', lw=0.5); ax.axvline(0, color='black', lw=0.5)

    ax.arrow(0,0,z1[0],z1[1], head_width=0.1, head_length=0.1, fc='#E74C3C', ec='#E74C3C', linewidth=3, zorder=5)
    ax.arrow(0,0,z2[0],z2[1], head_width=0.1, head_length=0.1, fc='#3498DB', ec='#3498DB', linewidth=3, zorder=5)
    ax.arrow(z1[0],z1[1],z2[0],z2[1], head_width=0.1, head_length=0.1, fc='#3498DB', ec='#3498DB', linewidth=2, linestyle='--', alpha=0.6)
    ax.arrow(z2[0],z2[1],z1[0],z1[1], head_width=0.1, head_length=0.1, fc='#E74C3C', ec='#E74C3C', linewidth=2, linestyle='--', alpha=0.6)
    ax.arrow(0,0,zsum[0],zsum[1], head_width=0.13, head_length=0.13, fc='#27AE60', ec='#27AE60', linewidth=3.5, zorder=4)

    ax.text(z1[0]/2-0.2, z1[1]/2-0.3, '$z_1$', fontsize=13, color='#E74C3C', fontweight='bold')
    ax.text(z2[0]/2-0.3, z2[1]/2-0.3, '$z_2$', fontsize=13, color='#3498DB', fontweight='bold')
    ax.text(zsum[0]/2+0.1, zsum[1]/2+0.1, '$z_1+z_2$', fontsize=13, color='#27AE60', fontweight='bold')

    # Same as vector addition — connect to 12A2
    ax.annotate('Same as vector addition!\n(Review 12A2 Example 8)', xy=(2, 3.5), fontsize=10,
                bbox=dict(boxstyle='round', facecolor='#FFF9C4', alpha=0.8))

    ax.set_xlim(-0.5, 4.5); ax.set_ylim(-0.5, 5)
    ax.set_aspect('equal'); ax.grid(True, alpha=0.25)
    ax.set_xlabel('Real'); ax.set_ylabel('Imaginary')
    ax.set_title('Complex Addition = Vector Addition (Parallelogram Law)', fontweight='bold', fontsize=13)
    save_fig(fig, '04-complex-addition.png')

# ═══════════════════════════════════════════════════════════
# 05 — Complex Multiplication = Rotation + Scaling
# ═══════════════════════════════════════════════════════════
def fig_05_complex_multiplication():
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(13, 6))

    z1 = np.array([2, 0.5])
    # Multiply by z2 = 1+i√3 = 2e^{iπ/3}: stretch by 2, rotate by 60°
    r2, th2 = 2, np.pi/3
    z2_mat = np.array([[r2*np.cos(th2), -r2*np.sin(th2)],
                        [r2*np.sin(th2), r2*np.cos(th2)]])

    # Left: before
    ax1.axhline(0,color='black',lw=0.5); ax1.axvline(0,color='black',lw=0.5)
    ax1.arrow(0,0,z1[0],z1[1], head_width=0.1, head_length=0.1, fc='#E74C3C', ec='#E74C3C', linewidth=3)
    ax1.text(z1[0]/2-0.2, z1[1]/2-0.3, '$z_1$', fontsize=13, color='#E74C3C', fontweight='bold')
    ax1.annotate(f'|z₁|={np.linalg.norm(z1):.2f}\narg≈{np.degrees(np.arctan2(z1[1],z1[0])):.0f}°',
                 xy=(2.5, 1.5), fontsize=10, bbox=dict(boxstyle='round', facecolor='#FADBD8', alpha=0.7))
    ax1.set_title('Before: $z_1$', fontweight='bold')
    ax1.set_xlim(-1, 6); ax1.set_ylim(-1, 6); ax1.set_aspect('equal'); ax1.grid(True, alpha=0.25)
    ax1.set_xlabel('Real'); ax1.set_ylabel('Imaginary')

    # Right: after multiplying by z2
    z_prod = z2_mat @ z1
    # Also show unit square transformed
    sq = np.array([[0,0],[1,0],[1,1],[0,1],[0,0]])
    t_sq = sq @ z2_mat.T
    ax2.fill(t_sq[:,0], t_sq[:,1], color='#3498DB', alpha=0.15, edgecolor='#2471A3', linewidth=1, linestyle='--')
    ax2.axhline(0,color='black',lw=0.5); ax2.axvline(0,color='black',lw=0.5)
    ax2.arrow(0,0,z_prod[0],z_prod[1], head_width=0.12, head_length=0.12, fc='#8E44AD', ec='#8E44AD', linewidth=3.5)
    ax2.text(z_prod[0]/2+0.15, z_prod[1]/2, '$z_1 \\cdot z_2$', fontsize=12, color='#8E44AD', fontweight='bold')
    ax2.annotate(f'|z₁z₂|={np.linalg.norm(z_prod):.2f}\narg≈{np.degrees(np.arctan2(z_prod[1],z_prod[0])):.0f}°\n\nStretch ×{r2:.0f}, Rotate +{np.degrees(th2):.0f}°',
                 xy=(3.5, 1.2), fontsize=10, bbox=dict(boxstyle='round', facecolor='#E8DAEF', alpha=0.7))
    ax2.set_title('After: $z_1 \\cdot z_2$ (Stretch+Rotate)', fontweight='bold')
    ax2.set_xlim(-1, 6); ax2.set_ylim(-1, 6); ax2.set_aspect('equal'); ax2.grid(True, alpha=0.25)
    ax2.set_xlabel('Real'); ax2.set_ylabel('Imaginary')

    fig.suptitle('Complex Multiplication = Rotation + Scaling\nz = re^{iθ} acts like rotation-scaling matrix [[r cosθ, -r sinθ],[r sinθ, r cosθ]]',
                fontweight='bold', fontsize=13)
    plt.tight_layout()
    save_fig(fig, '05-complex-multiplication-geometric.png')

# ═══════════════════════════════════════════════════════════
# 06 — Matrix Correspondence: a+bi ↔ rotation-scaling matrix
# ═══════════════════════════════════════════════════════════
def fig_06_matrix_correspondence():
    fig, axes = plt.subplots(2, 3, figsize=(14, 9))

    pairs = [
        (1+0j, '1 (identity)', '#27AE60'),
        (0+1j, 'i (90° rot)', '#3498DB'),
        (-1+0j, '-1 (180° rot)', '#E74C3C'),
        (2+0j, '2 (stretch ×2)', '#F39C12'),
        (1+1j, '1+i (stretch+rot)', '#8E44AD'),
        (0.6+0.8j, '0.6+0.8i (rot ~53°)', '#1ABC9C'),
    ]

    sq = np.array([[0,0],[1,0],[1,1],[0,1],[0,0]])
    for ax, (c, label, color) in zip(axes.flat, pairs):
        a, b = c.real, c.imag
        M = np.array([[a, -b], [b, a]])
        t_sq = sq @ M.T
        ax.fill(t_sq[:,0], t_sq[:,1], color=color, alpha=0.3, edgecolor=color, linewidth=2)
        ax.plot(t_sq[:,0], t_sq[:,1], 'o-', color=color, markersize=3)
        ax.arrow(0,0,M[0,0],M[1,0], head_width=0.1, head_length=0.1, fc='#E74C3C', ec='#E74C3C', lw=1.5, alpha=0.7)
        ax.arrow(0,0,M[0,1],M[1,1], head_width=0.1, head_length=0.1, fc='#3498DB', ec='#3498DB', lw=1.5, alpha=0.7)
        ax.set_title(f'z={label}\nM=[[{a},{ -b}],[{b},{a}]]',
                     fontsize=9, fontweight='bold')
        ax.set_aspect('equal'); ax.grid(True, alpha=0.2)
        ax.axhline(0,color='black',lw=0.3); ax.axvline(0,color='black',lw=0.3)
        ax.set_xlim(-3, 3); ax.set_ylim(-3, 3)

    fig.suptitle('Every Complex Number IS a Rotation-Scaling Matrix\n a+bi <-> [[a, -b],[b, a]]',
                fontweight='bold', fontsize=14)
    plt.tight_layout()
    save_fig(fig, '06-matrix-correspondence.png')

# ═══════════════════════════════════════════════════════════
# 07 — De Moivre: Powers Spiral Outward
# ═══════════════════════════════════════════════════════════
def fig_07_demoivre_spiral():
    fig, ax = plt.subplots(figsize=(7.5, 7.5))
    z0 = np.array([1.15, 0.35])  # r≈1.2, θ≈17°
    r = np.linalg.norm(z0)
    theta = np.arctan2(z0[1], z0[0])

    ax.axhline(0,color='black',lw=0.5); ax.axvline(0,color='black',lw=0.5)
    colors = plt.cm.plasma(np.linspace(0, 0.9, 8))

    prev = np.array([0.,0.])
    for n in range(1, 9):
        rn = r**n
        th_n = n * theta
        zn = np.array([rn*np.cos(th_n), rn*np.sin(th_n)])
        ax.arrow(prev[0], prev[1], zn[0]-prev[0], zn[1]-prev[1],
                head_width=0.08*rn, head_length=0.08*rn, fc=colors[n-1], ec=colors[n-1], linewidth=2)
        ax.plot(zn[0], zn[1], 'o', color=colors[n-1], markersize=8)
        ax.annotate(f'$z^{n}$', (zn[0], zn[1]), textcoords="offset points",
                    xytext=(5,5), fontsize=9, color=colors[n-1], fontweight='bold')
        prev = zn

    # Angle arcs
    for n in [1, 4, 8]:
        arc_r = 0.6 * r**n
        if arc_r < 0.1: arc_r = 0.3
        arc = Arc((0,0), arc_r, arc_r, angle=0, theta1=0, theta2=np.degrees(n*theta),
                  color=colors[n-1], linewidth=1.5, linestyle=':', alpha=0.5)
        ax.add_patch(arc)

    ax.set_xlim(-8, 8); ax.set_ylim(-8, 8)
    ax.set_aspect('equal'); ax.grid(True, alpha=0.2)
    ax.set_title('De Moivre: $z^n = r^n e^{inθ}$ — Powers Spiral Outward', fontweight='bold', fontsize=14)
    save_fig(fig, '07-demoivre-spiral.png')

# ═══════════════════════════════════════════════════════════
# 08 — Roots of Unity: Regular n-gon
# ═══════════════════════════════════════════════════════════
def fig_08_roots_unity_ngon():
    fig, axes = plt.subplots(1, 3, figsize=(15, 5.5))

    for ax, n, title in zip(axes, [3, 4, 6], ['n=3: Triangle', 'n=4: Square', 'n=6: Hexagon']):
        circle = Circle((0,0), 1.5, fill=False, color='gray', linestyle='--', alpha=0.4)
        ax.add_patch(circle)
        ax.axhline(0,color='black',lw=0.5); ax.axvline(0,color='black',lw=0.5)

        roots = [1.5*np.exp(1j*2*np.pi*k/n) for k in range(n)]
        poly_x = [r.real for r in roots] + [roots[0].real]
        poly_y = [r.imag for r in roots] + [roots[0].imag]

        ax.fill(poly_x, poly_y, color='#3498DB', alpha=0.2, edgecolor='#2471A3', linewidth=2)
        colors_pts = plt.cm.viridis(np.linspace(0, 0.9, n))
        for k, r in enumerate(roots):
            ax.plot(r.real, r.imag, 'o', color=colors_pts[k], markersize=12, zorder=5)
            lbl = f'$e^{{i·2π·{k}/{n}}}$'
            off_x = 15 if r.real > 0 else -25
            off_y = 15 if r.imag > 0 else -25
            ax.annotate(lbl, (r.real, r.imag), textcoords="offset points",
                       xytext=(off_x, off_y), fontsize=8, color=colors_pts[k], fontweight='bold')

        ax.text(0,0,f'Sum=0', fontsize=10, ha='center', va='center',
                bbox=dict(boxstyle='round', facecolor='white', alpha=0.8))
        ax.set_title(title, fontweight='bold', fontsize=12)
        ax.set_aspect('equal'); ax.set_xlim(-2.2, 2.2); ax.set_ylim(-2.2, 2.2)
        ax.set_xlabel('Re'); ax.set_ylabel('Im')

    fig.suptitle('Roots of Unity = Regular n-gon on the Unit Circle', fontweight='bold', fontsize=14)
    plt.tight_layout()
    save_fig(fig, '08-roots-unity-ngon.png')

# ═══════════════════════════════════════════════════════════
# 09 — Reciprocal Geometry: 1/z as Inversion + Reflection
# ═══════════════════════════════════════════════════════════
def fig_09_reciprocal_geometry():
    fig, ax = plt.subplots(figsize=(7.5, 7.5))

    # Unit circle
    circle = Circle((0,0), 1, fill=False, color='#27AE60', linewidth=2, linestyle='--', alpha=0.5)
    ax.add_patch(circle)
    ax.text(1.05, 0.7, 'Unit circle', fontsize=9, color='#27AE60', rotation=45)

    ax.axhline(0,color='black',lw=0.5); ax.axvline(0,color='black',lw=0.5)

    # Several points and their reciprocals
    points = [(2, 0.5), (0.5, 1.5), (0.3, 0.3), (2.5, 1)]
    colors = ['#E74C3C', '#3498DB', '#F39C12', '#8E44AD']

    for (x, y), c in zip(points, colors):
        z = x + 1j*y
        z_inv = 1/z  # = zbar/|z|²
        r = abs(z)

        # Original point
        ax.plot(x, y, 'o', color=c, markersize=12, zorder=5)
        ax.annotate(f'z', (x, y), textcoords="offset points", xytext=(8,8), fontsize=10, color=c, fontweight='bold')

        # Reciprocal
        ax.plot(z_inv.real, z_inv.imag, 's', color=c, markersize=12, zorder=5)
        ax.annotate(f'1/z', (z_inv.real, z_inv.imag), textcoords="offset points",
                    xytext=(8,-12), fontsize=10, color=c, fontweight='bold')

        # Dashed line connecting (illustrating inversion)
        ax.plot([x, z_inv.real], [y, z_inv.imag], ':', color=c, alpha=0.4, linewidth=1)

    ax.annotate('Inside → Outside\nOutside → Inside\n|z|·|1/z| = 1',
                xy=(2.5, 2.5), fontsize=11, bbox=dict(boxstyle='round', facecolor='#D5F5E3', alpha=0.8))

    ax.set_xlim(-0.5, 3.5); ax.set_ylim(-0.5, 3.5)
    ax.set_aspect('equal'); ax.grid(True, alpha=0.2)
    ax.set_xlabel('Real'); ax.set_ylabel('Imaginary')
    ax.set_title('Reciprocal: $1/z = \\bar{z}/|z|^2$ — Inversion + Reflection', fontweight='bold', fontsize=13)
    save_fig(fig, '09-reciprocal-geometry.png')

# ═══════════════════════════════════════════════════════════
# 10 — Quadratic Roots in Complex Plane
# ═══════════════════════════════════════════════════════════
def fig_10_quadratic_complex_roots():
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(13, 5.5))

    # Left: z²+1=0 → roots ±i
    x = np.linspace(-2, 2, 100)
    ax1.plot(x, x**2+1, 'b-', linewidth=2, label='$f(x)=x^2+1$')
    ax1.axhline(0, color='black', lw=0.8)
    ax1.axvline(0, color='black', lw=0.5)
    ax1.plot(0, 1, 'ro', markersize=10, zorder=5)
    ax1.annotate('$y=x^2+1$ never\ncrosses x-axis\n→ no real roots', xy=(1, 1.2), fontsize=10,
                bbox=dict(boxstyle='round', facecolor='#FADBD8', alpha=0.7))
    ax1.set_title('Real View: No x-intercepts', fontweight='bold')
    ax1.set_xlabel('x'); ax1.set_ylabel('y'); ax1.grid(True, alpha=0.25)
    ax1.set_xlim(-2.2, 2.2); ax1.set_ylim(-0.5, 4.5)

    # Right: Complex plane showing ±i
    circle_r = Circle((0,0), 1, fill=False, color='gray', linestyle='--', alpha=0.3)
    ax2.add_patch(circle_r)
    ax2.axhline(0, color='black', lw=0.8); ax2.axvline(0, color='black', lw=0.5)
    ax2.plot(0, 1, 'o', color='#E74C3C', markersize=14, zorder=5)
    ax2.plot(0, -1, 'o', color='#E74C3C', markersize=14, zorder=5)
    ax2.annotate('$z=i$', (0, 1), textcoords="offset points", xytext=(15,10), fontsize=12, color='#E74C3C', fontweight='bold')
    ax2.annotate('$z=-i$', (0, -1), textcoords="offset points", xytext=(15,-15), fontsize=12, color='#E74C3C', fontweight='bold')
    ax2.annotate('Complex roots:\nconjugate pair\non imaginary axis', xy=(-1.5, 1.5), fontsize=10,
                bbox=dict(boxstyle='round', facecolor='#D5F5E3', alpha=0.7))
    ax2.set_title('Complex View: $z^2+1=0$ → $z=\\pm i$', fontweight='bold')
    ax2.set_xlabel('Real'); ax2.set_ylabel('Imaginary')
    ax2.set_aspect('equal'); ax2.grid(True, alpha=0.25)
    ax2.set_xlim(-2, 2); ax2.set_ylim(-2, 2)

    fig.suptitle('Fundamental Theorem of Algebra: Degree n → Exactly n Complex Roots\n$x^2+1=0$ has two complex roots (conjugate pair)',
                fontweight='bold', fontsize=13)
    plt.tight_layout()
    save_fig(fig, '10-quadratic-complex-roots.png')

# ═══════════════════════════════════════════════════════════
# 11 — Argument Addition in Multiplication
# ═══════════════════════════════════════════════════════════
def fig_11_argument_addition():
    fig, ax = plt.subplots(figsize=(7.5, 7.5))

    z1_r, z1_th = 1.5, np.radians(30)
    z2_r, z2_th = 2.0, np.radians(50)
    z1 = np.array([z1_r*np.cos(z1_th), z1_r*np.sin(z1_th)])
    z2 = np.array([z2_r*np.cos(z2_th), z2_r*np.sin(z2_th)])
    z_prod_r = z1_r * z2_r
    z_prod_th = z1_th + z2_th
    z_prod = np.array([z_prod_r*np.cos(z_prod_th), z_prod_r*np.sin(z_prod_th)])

    ax.axhline(0,color='black',lw=0.5); ax.axvline(0,color='black',lw=0.5)

    # z1
    ax.arrow(0,0,z1[0],z1[1], head_width=0.1, head_length=0.1, fc='#E74C3C', ec='#E74C3C', linewidth=3, zorder=5)
    ax.text(z1[0]/2-0.2, z1[1]/2-0.2, '$z_1$', fontsize=12, color='#E74C3C', fontweight='bold')

    # Angle arc for z1
    arc1 = Arc((0,0), 1.2, 1.2, angle=0, theta1=0, theta2=np.degrees(z1_th), color='#E74C3C', linewidth=2)
    ax.add_patch(arc1)
    ax.text(0.65, 0.2, '$θ_1$', fontsize=10, color='#E74C3C')

    # z2
    ax.arrow(0,0,z2[0],z2[1], head_width=0.12, head_length=0.12, fc='#3498DB', ec='#3498DB', linewidth=3, zorder=5)
    ax.text(z2[0]/2+0.15, z2[1]/2-0.2, '$z_2$', fontsize=12, color='#3498DB', fontweight='bold')

    # Angle arc for z2
    arc2 = Arc((0,0), 1.7, 1.7, angle=0, theta1=np.degrees(z1_th), theta2=np.degrees(z2_th), color='#3498DB', linewidth=2)
    ax.add_patch(arc2)
    ax.text(1.1, 1.1, '$θ_2$', fontsize=10, color='#3498DB')

    # Product z1·z2
    ax.arrow(0,0,z_prod[0],z_prod[1], head_width=0.15, head_length=0.15, fc='#8E44AD', ec='#8E44AD', linewidth=3.5, zorder=4)
    ax.text(z_prod[0]/2-0.3, z_prod[1]/2+0.2, '$z_1 z_2$', fontsize=12, color='#8E44AD', fontweight='bold')

    # Total angle arc
    arc_tot = Arc((0,0), 2.3, 2.3, angle=0, theta1=0, theta2=np.degrees(z_prod_th), color='#8E44AD', linewidth=2.5, linestyle='--')
    ax.add_patch(arc_tot)
    ax.text(1.8, 1.6, '$θ_1+θ_2$', fontsize=10, color='#8E44AD', fontweight='bold')

    ax.annotate('Multiply moduli: $r_1·r_2$\nAdd arguments: $θ_1+θ_2$',
                xy=(2.5, 0.5), fontsize=11, bbox=dict(boxstyle='round', facecolor='#E8DAEF', alpha=0.8))

    ax.set_xlim(-0.5, 4.5); ax.set_ylim(-0.5, 4.5)
    ax.set_aspect('equal'); ax.grid(True, alpha=0.2)
    ax.set_xlabel('Real'); ax.set_ylabel('Imaginary')
    ax.set_title('Complex Multiplication = Multiply Moduli, Add Arguments', fontweight='bold', fontsize=13)
    save_fig(fig, '11-argument-addition.png')

# ═══════════════════════════════════════════════════════════
# 12 — Complete Complex Plane Summary
# ═══════════════════════════════════════════════════════════
def fig_12_complex_plane_summary():
    fig, ax = plt.subplots(figsize=(8, 8))

    ax.axhline(0, color='black', lw=1); ax.axvline(0, color='black', lw=1)

    # Unit circle
    circle = Circle((0,0), 2, fill=False, color='gray', linestyle='--', alpha=0.3)
    ax.add_patch(circle)

    # Show multiple concepts on one plane
    # 1. A point in Q1
    z1 = np.array([2.5, 1.5])
    ax.arrow(0,0,z1[0],z1[1], head_width=0.12, head_length=0.12, fc='#E74C3C', ec='#E74C3C', linewidth=2.5)
    ax.annotate('$z=re^{iθ}$\n(modulus, argument)', (z1[0],z1[1]), textcoords="offset points",
                xytext=(10,10), fontsize=9, color='#E74C3C')

    # 2. Conjugate in Q4
    ax.arrow(0,0,z1[0],-z1[1], head_width=0.1, head_length=0.1, fc='#3498DB', ec='#3498DB', linewidth=2, linestyle='--')
    ax.annotate(r'$\bar{z}$ (reflection)', (z1[0],-z1[1]), textcoords="offset points",
                xytext=(10,-15), fontsize=9, color='#3498DB')

    # 3. i*z1 (rotate 90°)
    iz1 = np.array([-z1[1], z1[0]])
    ax.arrow(0,0,iz1[0],iz1[1], head_width=0.1, head_length=0.1, fc='#27AE60', ec='#27AE60', linewidth=2, linestyle='--')
    ax.annotate('$iz$ (rotate 90°)', (iz1[0],iz1[1]), textcoords="offset points",
                xytext=(-25,10), fontsize=9, color='#27AE60')

    # 4. Real axis label
    ax.text(5, -0.3, 'ℝ (Real axis)', fontsize=12, fontweight='bold', ha='center')
    ax.text(-0.35, 4.5, 'iℝ\n(Imaginary\n axis)', fontsize=10, fontweight='bold', ha='center')

    # Quadrant labels
    for (x, y, q) in [(3,3,'I'), (-3,3,'II'), (-3,-3,'III'), (3,-3,'IV')]:
        ax.text(x, y, q, fontsize=14, fontweight='bold', alpha=0.3, ha='center', va='center')

    ax.set_xlim(-5, 5.5); ax.set_ylim(-5, 5)
    ax.set_aspect('equal'); ax.grid(True, alpha=0.2)
    ax.set_title('The Complex Plane — All Geometric Operations at a Glance', fontweight='bold', fontsize=14)
    save_fig(fig, '12-complex-plane-summary.png')

# ═══════════════════════════════════════════════════════════
# Generate all
# ═══════════════════════════════════════════════════════════
if __name__ == '__main__':
    print("Generating 12A1 Complex Numbers graphs...")
    fig_01_complex_plane_polar()
    fig_02_i_powers_cycle()
    fig_03_conjugate_reflection()
    fig_04_complex_addition()
    fig_05_complex_multiplication()
    fig_06_matrix_correspondence()
    fig_07_demoivre_spiral()
    fig_08_roots_unity_ngon()
    fig_09_reciprocal_geometry()
    fig_10_quadratic_complex_roots()
    fig_11_argument_addition()
    fig_12_complex_plane_summary()
    print(f"Done! All graphs saved to {OUTPUT_DIR}/")
