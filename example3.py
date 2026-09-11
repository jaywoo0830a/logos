#!/usr/bin/env python3
"""Generate all visual graphs for 12A2 Matrices and Vectors session."""
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyArrowPatch, Polygon, Arc, FancyBboxPatch
import numpy as np
from mpl_toolkits.mplot3d import Axes3D
from mpl_toolkits.mplot3d.art3d import Poly3DCollection
import os

OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))
os.makedirs(OUTPUT_DIR, exist_ok=True)

plt.rcParams.update({
    'figure.dpi': 150,
    'savefig.dpi': 150,
    'font.size': 11,
    'axes.titlesize': 13,
    'axes.labelsize': 11,
    'savefig.facecolor': 'white',
    'savefig.edgecolor': 'none',
    'figure.facecolor': 'white',
})

def save_fig(fig, name):
    """Save figure with consistent white background and tight bounding box."""
    fig.savefig(f'{OUTPUT_DIR}/{name}', bbox_inches='tight', facecolor='white',
                edgecolor='none', pad_inches=0.15)
    plt.close(fig)

# ─────────────────────────────────────────────────────────
# 01 — Matrix Transformation: Unit Square → Parallelogram
# ─────────────────────────────────────────────────────────
def fig_01_matrix_transformation():
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5.5))

    # Left: unit square
    square = np.array([[0,0],[1,0],[1,1],[0,1],[0,0]])
    ax1.fill(square[:,0], square[:,1], color='#4ECDC4', alpha=0.4, edgecolor='#2C8C84', linewidth=2)
    ax1.plot(square[:,0], square[:,1], 'o-', color='#2C8C84', markersize=5)
    ax1.annotate('(0,0)', (0,0), textcoords="offset points", xytext=(-12,-15), fontsize=9, color='#555')
    ax1.annotate('(1,0)', (1,0), textcoords="offset points", xytext=(5,-15), fontsize=9, color='#555')
    ax1.annotate('(1,1)', (1,1), textcoords="offset points", xytext=(5,5), fontsize=9, color='#555')
    ax1.annotate('(0,1)', (0,1), textcoords="offset points", xytext=(-22,5), fontsize=9, color='#555')
    # Basis vectors
    ax1.arrow(0,0,1,0, head_width=0.05, head_length=0.05, fc='#E74C3C', ec='#E74C3C', linewidth=2, zorder=5)
    ax1.arrow(0,0,0,1, head_width=0.05, head_length=0.05, fc='#3498DB', ec='#3498DB', linewidth=2, zorder=5)
    ax1.text(0.5, -0.18, r'$\vec{e}_1$', fontsize=11, color='#E74C3C', ha='center')
    ax1.text(-0.22, 0.5, r'$\vec{e}_2$', fontsize=11, color='#3498DB', va='center')
    ax1.set_title('Unit Square (Before)', fontweight='bold', pad=10)
    ax1.set_xlim(-0.5, 2.0); ax1.set_ylim(-0.5, 2.0)
    ax1.set_aspect('equal'); ax1.grid(True, alpha=0.3)
    ax1.axhline(0, color='black', linewidth=0.5); ax1.axvline(0, color='black', linewidth=0.5)

    # Right: Parallelogram after A = [[2,1],[0.5,1.5]]
    A = np.array([[2, 1], [0.5, 1.5]])
    corners = np.array([[0,0], A@[1,0], A@[1,0]+A@[0,1], A@[0,1], [0,0]])
    ax2.fill(corners[:,0], corners[:,1], color='#FF6B6B', alpha=0.35, edgecolor='#C0392B', linewidth=2)
    ax2.plot(corners[:,0], corners[:,1], 'o-', color='#C0392B', markersize=5)
    # Transformed basis
    e1_img = A @ [1,0]
    e2_img = A @ [0,1]
    ax2.arrow(0,0,e1_img[0],e1_img[1], head_width=0.06, head_length=0.06, fc='#E74C3C', ec='#E74C3C', linewidth=2.5, zorder=5)
    ax2.arrow(0,0,e2_img[0],e2_img[1], head_width=0.06, head_length=0.06, fc='#3498DB', ec='#3498DB', linewidth=2.5, zorder=5)
    ax2.text(e1_img[0]/2-0.1, e1_img[1]/2-0.2, r'$A\vec{e}_1$', fontsize=10, color='#E74C3C')
    ax2.text(e2_img[0]/2-0.3, e2_img[1]/2, r'$A\vec{e}_2$', fontsize=10, color='#3498DB')
    ax2.annotate(f'({e1_img[0]:.1f},{e1_img[1]:.1f})', (e1_img[0],e1_img[1]), textcoords="offset points", xytext=(5,5), fontsize=8)
    ax2.annotate(f'({e2_img[0]:.1f},{e2_img[1]:.1f})', (e2_img[0],e2_img[1]), textcoords="offset points", xytext=(5,5), fontsize=8)
    ax2.set_title(f'Parallelogram (After A), det={np.linalg.det(A):.1f}', fontweight='bold', pad=10)
    ax2.set_xlim(-0.5, 4.0); ax2.set_ylim(-0.5, 3.5)
    ax2.set_aspect('equal'); ax2.grid(True, alpha=0.3)
    ax2.axhline(0, color='black', linewidth=0.5); ax2.axvline(0, color='black', linewidth=0.5)

    fig.suptitle('Matrix as Linear Transformation: Columns = Images of Basis Vectors', fontsize=14, fontweight='bold', y=1.02)
    plt.tight_layout()
    save_fig(fig, '01-matrix-transformation-2d.png')

# ─────────────────────────────────────────────────────────
# 02 — Determinant = Area Scaling Factor
# ─────────────────────────────────────────────────────────
def fig_02_determinant_area():
    fig, axes = plt.subplots(2, 3, figsize=(14, 9))

    matrices = [
        (np.array([[1,0],[0,1]]), 'I: det=1', 'Identical'),
        (np.array([[3,0],[0,2]]), 'diag(3,2): det=6', 'Stretch'),
        (np.array([[0,-1],[1,0]]), 'Rot 90°: det=1', 'Rotation'),
        (np.array([[1,0.8],[0,1]]), 'Shear: det=1', 'Shear'),
        (np.array([[1,0],[0,-1]]), 'Reflect y: det=-1', 'Reflection'),
        (np.array([[2,3],[4,6]]), 'Singular: det=0', 'Collapse'),
    ]

    for ax, (A, title, label) in zip(axes.flat, matrices):
        d = np.linalg.det(A)
        # Original unit square
        sq = np.array([[0,0],[1,0],[1,1],[0,1],[0,0]])
        ax.fill(sq[:,0], sq[:,1], color='#BDC3C7', alpha=0.3, edgecolor='#95A5A6', linewidth=1, linestyle='--')
        ax.plot(sq[:,0], sq[:,1], '--', color='#95A5A6', linewidth=0.8)
        # Transformed
        corners = np.array([A@[0,0], A@[1,0], A@[1,0]+A@[0,1], A@[0,1], [0,0]])
        fill_alpha = 0.5 if abs(d) > 0.01 else 0.2
        ax.fill(corners[:,0], corners[:,1], color='#E74C3C', alpha=fill_alpha, edgecolor='#C0392B', linewidth=2)
        ax.plot(corners[:,0], corners[:,1], 'o-', color='#C0392B', markersize=4)
        # Basis images
        if abs(d) > 0.01:
            ax.arrow(0,0,A[0,0],A[1,0], head_width=0.08, head_length=0.08, fc='#E74C3C', ec='#E74C3C', linewidth=1.8)
            ax.arrow(0,0,A[0,1],A[1,1], head_width=0.08, head_length=0.08, fc='#3498DB', ec='#3498DB', linewidth=1.8)
            ax.set_title(f'{title}\n{label} (|det|={abs(d):.0f})', fontsize=9, fontweight='bold', linespacing=1.3)
        ax.set_aspect('equal')
        ax.grid(True, alpha=0.25)
        ax.axhline(0,color='black',lw=0.3); ax.axvline(0,color='black',lw=0.3)
        ax.set_xlim(-3, 5); ax.set_ylim(-3, 5)

    fig.suptitle('Determinant = Area Scaling: 6 Types of 2×2 Transformations', fontsize=14, fontweight='bold')
    plt.tight_layout()
    save_fig(fig, '02-determinant-area-scaling.png')

# ─────────────────────────────────────────────────────────
# 03 — Matrix Multiplication as Composition
# ─────────────────────────────────────────────────────────
def fig_03_matrix_multiplication():
    fig, axes = plt.subplots(1, 4, figsize=(16, 4.5))

    A = np.array([[0,-1],[1,0]])  # Rot 90
    B = np.array([[1,1],[0,1]])   # Shear

    labels = [
        (np.eye(2), 'Start\nUnit Square'),
        (B, 'Step 1: Apply B\n(Shear)'),
        (A, 'Step 2: Apply A\n(Rotate)'),
        (A@B, 'Result: AB\n(Shear then Rotate)'),
    ]

    # Original unit square
    sq = np.array([[0,0],[1,0],[1,1],[0,1],[0,0]])
    for ax, (M, title) in zip(axes, labels):
        if np.array_equal(M, np.eye(2)):
            ax.fill(sq[:,0], sq[:,1], color='#3498DB', alpha=0.4, edgecolor='#2471A3', linewidth=2)
        else:
            ax.fill(sq[:,0], sq[:,1], color='#BDC3C7', alpha=0.2, edgecolor='#95A5A6', linewidth=1, linestyle='--')
            corners = np.array([M@[0,0], M@[1,0], M@[1,0]+M@[0,1], M@[0,1], [0,0]])
            ax.fill(corners[:,0], corners[:,1], color='#E74C3C', alpha=0.45, edgecolor='#C0392B', linewidth=2)
        # Basis
        ax.arrow(0,0,M[0,0],M[1,0], head_width=0.08, head_length=0.08, fc='#E74C3C', ec='#E74C3C', linewidth=2)
        ax.arrow(0,0,M[0,1],M[1,1], head_width=0.08, head_length=0.08, fc='#3498DB', ec='#3498DB', linewidth=2)
        ax.set_title(title, fontsize=9.5, fontweight='bold')
        ax.set_aspect('equal'); ax.grid(True, alpha=0.25)
        ax.axhline(0,color='black',lw=0.3); ax.axvline(0,color='black',lw=0.3)
        ax.set_xlim(-2, 3); ax.set_ylim(-2, 3)

    ax.set_title('Matrix Multiplication = Composition of Transformations', fontsize=13, fontweight='bold')
    plt.tight_layout()
    save_fig(fig, '03-matrix-multiplication-composition.png')

# ─────────────────────────────────────────────────────────
# 04 — Inverse Matrix Geometry
# ─────────────────────────────────────────────────────────
def fig_04_inverse_matrix():
    fig, axes = plt.subplots(1, 4, figsize=(16, 4.5))
    A = np.array([[2,1],[1,3]])
    Ainv = np.linalg.inv(A)

    sq = np.array([[0,0],[1,0],[1,1],[0,1],[0,0]])
    steps = [
        (np.eye(2), 'Start\nUnit Square', '#3498DB'),
        (A, 'Apply A\nStretch+Shear', '#E74C3C'),
        (Ainv, 'Apply A⁻¹\nReverse', '#27AE60'),
        (Ainv@A, 'A⁻¹A = I\nBack to Square', '#8E44AD'),
    ]

    for ax, (M, title, color) in zip(axes, steps):
        corners = np.array([M@[0,0], M@[1,0], M@[1,0]+M@[0,1], M@[0,1], [0,0]])
        ax.fill(sq[:,0], sq[:,1], color='#BDC3C7', alpha=0.15, edgecolor='#95A5A6', linewidth=1, linestyle='--')
        ax.fill(corners[:,0], corners[:,1], color=color, alpha=0.4, edgecolor=color, linewidth=2)
        ax.plot(corners[:,0], corners[:,1], 'o-', color=color, markersize=4)
        ax.arrow(0,0,M[0,0],M[1,0], head_width=0.08, head_length=0.08, fc='#E74C3C', ec='#E74C3C', lw=1.8)
        ax.arrow(0,0,M[0,1],M[1,1], head_width=0.08, head_length=0.08, fc='#3498DB', ec='#3498DB', lw=1.8)
        ax.set_title(title, fontsize=9.5, fontweight='bold')
        ax.set_aspect('equal'); ax.grid(True, alpha=0.25)
        ax.axhline(0,color='black',lw=0.3); ax.axvline(0,color='black',lw=0.3)
        ax.set_xlim(-1, 4); ax.set_ylim(-1, 4)

    fig.suptitle('Inverse Matrix: Undoing a Transformation — A⁻¹(A(□)) = □', fontsize=13, fontweight='bold')
    plt.tight_layout()
    save_fig(fig, '04-inverse-matrix-geometry.png')

# ─────────────────────────────────────────────────────────
# 05 — Rotation Matrix
# ─────────────────────────────────────────────────────────
def fig_05_rotation_matrix():
    fig, ax = plt.subplots(figsize=(7, 7))
    thetas = [0, 30, 60, 90, 120]
    colors = plt.cm.viridis(np.linspace(0.2, 0.9, len(thetas)))
    v0 = np.array([2, 0.5])

    ax.plot([0, v0[0]], [0, v0[1]], 'ko-', linewidth=3, markersize=8, label=f'Original v = {tuple(v0)}', zorder=5)
    for th, c in zip(thetas, colors):
        R = np.array([[np.cos(np.radians(th)), -np.sin(np.radians(th))],
                       [np.sin(np.radians(th)), np.cos(np.radians(th))]])
        vR = R @ v0
        ax.plot([0, vR[0]], [0, vR[1]], 'o-', color=c, linewidth=2, markersize=6, label=f'{th}°', zorder=4)
        # Arc
        arc = Arc((0,0), np.linalg.norm(v0)*2, np.linalg.norm(v0)*2, angle=0,
                  theta1=np.degrees(np.arctan2(v0[1],v0[0])),
                  theta2=np.degrees(np.arctan2(vR[1],vR[0])), color=c, linewidth=1.5, linestyle='--')
        ax.add_patch(arc)

    ax.legend(fontsize=9, loc='upper right')
    ax.set_xlim(-3, 3); ax.set_ylim(-3, 3)
    ax.set_aspect('equal'); ax.grid(True, alpha=0.3)
    ax.axhline(0,color='black',lw=0.5); ax.axvline(0,color='black',lw=0.5)
    ax.set_title('Rotation Matrix R(θ): Preserves Length, Changes Direction', fontweight='bold')
    save_fig(fig, '05-rotation-matrix.png')

# ─────────────────────────────────────────────────────────
# 06 — Reflection Matrix
# ─────────────────────────────────────────────────────────
def fig_06_reflection_matrix():
    fig, axes = plt.subplots(1, 3, figsize=(15, 5))

    # Three reflections
    reflections = [
        (np.array([[1,0],[0,-1]]), 'Reflect across x-axis\n(flip y sign)', r'$R_x = [[1,0],[0,-1]]$'),
        (np.array([[-1,0],[0,1]]), 'Reflect across y-axis\n(flip x sign)', r'$R_y = [[-1,0],[0,1]]$'),
        (np.array([[0,1],[1,0]]), 'Reflect across y=x\n(swap coordinates)', r'$R_{y=x} = [[0,1],[1,0]]$'),
    ]

    v0 = np.array([2, 1.5])
    sq = np.array([[0,0],[1,0],[1,1],[0,1],[0,0]])

    for ax, (R, title, formula) in zip(axes, reflections):
        ax.fill(sq[:,0], sq[:,1], color='#BDC3C7', alpha=0.2, edgecolor='#95A5A6', linewidth=1, linestyle='--')
        corners = np.array([R@[0,0], R@[1,0], R@[1,0]+R@[0,1], R@[0,1], [0,0]])
        ax.fill(corners[:,0], corners[:,1], color='#9B59B6', alpha=0.35, edgecolor='#7D3C98', linewidth=2)
        # Original v
        ax.arrow(0,0,v0[0],v0[1], head_width=0.1, head_length=0.1, fc='gray', ec='gray', linewidth=2, alpha=0.6, linestyle='--')
        # Reflected v
        vR = R@v0
        ax.arrow(0,0,vR[0],vR[1], head_width=0.1, head_length=0.1, fc='#E74C3C', ec='#E74C3C', linewidth=2.5)
        # Mirror line
        if np.array_equal(R, np.array([[1,0],[0,-1]])):
            ax.axhline(0, color='green', linewidth=1.5, linestyle=':', alpha=0.7)
        elif np.array_equal(R, np.array([[-1,0],[0,1]])):
            ax.axvline(0, color='green', linewidth=1.5, linestyle=':', alpha=0.7)
        else:
            ax.plot([-3,3],[-3,3], ':', color='green', linewidth=1.5, alpha=0.7)
        ax.set_title(f'{title}\n{formula}', fontsize=9.5, fontweight='bold')
        ax.set_aspect('equal'); ax.grid(True, alpha=0.25)
        ax.axhline(0,color='black',lw=0.3); ax.axvline(0,color='black',lw=0.3)
        ax.set_xlim(-3.5, 3.5); ax.set_ylim(-3.5, 3.5)

    fig.suptitle('Reflection Matrices: Mirroring Space Across Lines', fontsize=13, fontweight='bold')
    plt.tight_layout()
    save_fig(fig, '06-reflection-matrix.png')

# ─────────────────────────────────────────────────────────
# 07 — Shear Matrix
# ─────────────────────────────────────────────────────────
def fig_07_shear_matrix():
    fig, axes = plt.subplots(1, 2, figsize=(12, 5.5))

    shears = [
        (np.array([[1,1.5],[0,1]]), 'Horizontal Shear\n$S_x = [[1,k],[0,1]]$'),
        (np.array([[1,0],[1.5,1]]), 'Vertical Shear\n$S_y = [[1,0],[k,1]]$'),
    ]

    sq = np.array([[0,0],[1,0],[1,1],[0,1],[0,0]])
    for ax, (S, title) in zip(axes, shears):
        ax.fill(sq[:,0], sq[:,1], color='#BDC3C7', alpha=0.2, edgecolor='#95A5A6', linewidth=1, linestyle='--')
        corners = np.array([S@[0,0], S@[1,0], S@[1,0]+S@[0,1], S@[0,1], [0,0]])
        ax.fill(corners[:,0], corners[:,1], color='#F39C12', alpha=0.4, edgecolor='#D68910', linewidth=2)
        ax.plot(corners[:,0], corners[:,1], 'o-', color='#D68910', markersize=4)
        ax.arrow(0,0,S[0,0],S[1,0], head_width=0.08, head_length=0.08, fc='#E74C3C', ec='#E74C3C', lw=2)
        ax.arrow(0,0,S[0,1],S[1,1], head_width=0.08, head_length=0.08, fc='#3498DB', ec='#3498DB', lw=2)
        ax.set_title(title, fontsize=11, fontweight='bold')
        ax.set_aspect('equal'); ax.grid(True, alpha=0.25)
        ax.axhline(0,color='black',lw=0.3); ax.axvline(0,color='black',lw=0.3)
        ax.set_xlim(-0.5, 4); ax.set_ylim(-0.5, 4)

    fig.suptitle('Shear Matrices: Tilting Space — Area Preserved (det=1)', fontsize=13, fontweight='bold')
    plt.tight_layout()
    save_fig(fig, '07-shear-matrix.png')

# ─────────────────────────────────────────────────────────
# 08 — Vector Addition
# ─────────────────────────────────────────────────────────
def fig_08_vector_addition():
    fig, ax = plt.subplots(figsize=(7, 7))
    a = np.array([3, 1])
    b = np.array([1, 2.5])
    c = a + b

    # Vectors
    ax.arrow(0,0,a[0],a[1], head_width=0.12, head_length=0.12, fc='#E74C3C', ec='#E74C3C', linewidth=3, zorder=5)
    ax.arrow(0,0,b[0],b[1], head_width=0.12, head_length=0.12, fc='#3498DB', ec='#3498DB', linewidth=3, zorder=5)
    # Parallelogram (b from tip of a)
    ax.arrow(a[0],a[1],b[0],b[1], head_width=0.12, head_length=0.12, fc='#3498DB', ec='#3498DB', linewidth=2, linestyle='--', alpha=0.6)
    ax.arrow(b[0],b[1],a[0],a[1], head_width=0.12, head_length=0.12, fc='#E74C3C', ec='#E74C3C', linewidth=2, linestyle='--', alpha=0.6)
    # Resultant
    ax.arrow(0,0,c[0],c[1], head_width=0.14, head_length=0.14, fc='#27AE60', ec='#27AE60', linewidth=3.5, zorder=4)
    # Dashed parallelogram
    ax.plot([a[0],c[0]],[a[1],c[1]], '--', color='#3498DB', alpha=0.4, linewidth=1.5)
    ax.plot([b[0],c[0]],[b[1],c[1]], '--', color='#E74C3C', alpha=0.4, linewidth=1.5)

    ax.text(a[0]/2-0.2, a[1]/2-0.3, r'$\vec{a}$', fontsize=13, color='#E74C3C', fontweight='bold')
    ax.text(b[0]/2-0.3, b[1]/2-0.3, r'$\vec{b}$', fontsize=13, color='#3498DB', fontweight='bold')
    ax.text(c[0]/2+0.1, c[1]/2+0.1, r'$\vec{a}+\vec{b}$', fontsize=13, color='#27AE60', fontweight='bold')

    ax.set_xlim(-0.5, 5); ax.set_ylim(-0.5, 4.5)
    ax.set_aspect('equal'); ax.grid(True, alpha=0.3)
    ax.axhline(0,color='black',lw=0.5); ax.axvline(0,color='black',lw=0.5)
    ax.set_title('Vector Addition: Tip-to-Tail (Parallelogram Law)', fontweight='bold', fontsize=14)
    save_fig(fig, '08-vector-addition.png')

# ─────────────────────────────────────────────────────────
# 09 — Vector Magnitude and Unit Vector
# ─────────────────────────────────────────────────────────
def fig_09_vector_magnitude():
    fig, ax = plt.subplots(figsize=(7, 7))
    v = np.array([3, 4])
    mag = np.linalg.norm(v)
    u = v / mag

    ax.arrow(0,0,v[0],v[1], head_width=0.15, head_length=0.15, fc='#E74C3C', ec='#E74C3C', linewidth=3)
    ax.arrow(0,0,u[0],u[1], head_width=0.12, head_length=0.12, fc='#27AE60', ec='#27AE60', linewidth=3)

    # Dashed lines to axes
    ax.plot([v[0],v[0]],[0,v[1]], '--', color='gray', alpha=0.5, linewidth=1)
    ax.plot([0,v[0]],[v[1],v[1]], '--', color='gray', alpha=0.5, linewidth=1)

    # Right angle at projections
    ax.plot([v[0]-0.2,v[0]],[0,0], 'k-', linewidth=1)
    ax.plot([v[0]-0.2,v[0]-0.2],[0,0.2], 'k-', linewidth=1)

    ax.text(v[0]/2-0.3, v[1]/2+0.2, f'|v⃗| = {mag}', fontsize=12, color='#E74C3C', fontweight='bold')
    ax.text(u[0]/2+0.15, u[1]/2-0.3, 'û (unit)', fontsize=11, color='#27AE60', fontweight='bold')
    ax.text(v[0]+0.1, v[1]/2, f'v₂={v[1]}', fontsize=10, color='gray')
    ax.text(v[0]/2, -0.25, f'v₁={v[0]}', fontsize=10, color='gray')

    # Pythagoras
    ax.annotate(f'|v⃗| = √({v[0]}²+{v[1]}²)\n     = √{v[0]**2+v[1]**2}\n     = {mag}',
                xy=(1.5, 3.5), fontsize=11, bbox=dict(boxstyle='round', facecolor='#FFF9C4', alpha=0.8))

    ax.set_xlim(-0.5, 4.5); ax.set_ylim(-0.5, 5)
    ax.set_aspect('equal'); ax.grid(True, alpha=0.3)
    ax.axhline(0,color='black',lw=0.5); ax.axvline(0,color='black',lw=0.5)
    ax.set_title('Vector Magnitude: Pythagorean Theorem in Components', fontweight='bold', fontsize=14)
    save_fig(fig, '09-vector-magnitude.png')

# ─────────────────────────────────────────────────────────
# 10 — Dot Product: Angle Between Vectors
# ─────────────────────────────────────────────────────────
def fig_10_dot_product():
    fig, ax = plt.subplots(figsize=(7.5, 7.5))
    a = np.array([3, 1])
    b = np.array([1, 3])
    dot = np.dot(a,b)
    mag_a, mag_b = np.linalg.norm(a), np.linalg.norm(b)
    cos_theta = dot/(mag_a*mag_b)
    theta = np.arccos(cos_theta)

    ax.arrow(0,0,a[0],a[1], head_width=0.12, head_length=0.12, fc='#E74C3C', ec='#E74C3C', linewidth=3)
    ax.arrow(0,0,b[0],b[1], head_width=0.12, head_length=0.12, fc='#3498DB', ec='#3498DB', linewidth=3)

    # Angle arc
    arc_theta1 = np.degrees(np.arctan2(b[1],b[0]))
    arc_theta2 = np.degrees(np.arctan2(a[1],a[0]))
    arc = Arc((0,0), 1.2, 1.2, angle=0, theta1=arc_theta1, theta2=arc_theta2, color='#8E44AD', linewidth=2.5)
    ax.add_patch(arc)
    ax.text(0.55, 0.55, f'θ≈{np.degrees(theta):.1f}°', fontsize=11, color='#8E44AD', fontweight='bold')

    # Right angle indicator (cos = 0 check)
    perp = np.array([-a[1], a[0]])/np.linalg.norm(a)*mag_a*0.5
    ax.arrow(0,0,perp[0],perp[1], head_width=0.08, head_length=0.08, fc='gray', ec='gray', linewidth=1.5, linestyle=':', alpha=0.5)
    ax.text(perp[0]/2-0.3, perp[1]/2, '⊥ to a⃗', fontsize=9, color='gray', alpha=0.7)

    ax.text(a[0]/2-0.3, a[1]/2-0.3, r'$\vec{a}$', fontsize=13, color='#E74C3C', fontweight='bold')
    ax.text(b[0]/2+0.1, b[1]/2-0.3, r'$\vec{b}$', fontsize=13, color='#3498DB', fontweight='bold')

    ax.annotate(f'a⃗·b⃗ = {dot}\n|a⃗|={mag_a:.2f}, |b⃗|={mag_b:.2f}\ncos θ = {dot}/{mag_a:.2f}·{mag_b:.2f} = {cos_theta:.3f}',
                xy=(2.8, 2.8), fontsize=10, bbox=dict(boxstyle='round', facecolor='#E8DAEF', alpha=0.8))

    ax.set_xlim(-0.5, 4); ax.set_ylim(-0.5, 4)
    ax.set_aspect('equal'); ax.grid(True, alpha=0.3)
    ax.axhline(0,color='black',lw=0.5); ax.axvline(0,color='black',lw=0.5)
    ax.set_title('Dot Product = |a⃗||b⃗|cos θ — Measures Angle', fontweight='bold', fontsize=14)
    save_fig(fig, '10-dot-product-angle.png')

# ─────────────────────────────────────────────────────────
# 11 — Vector Projection
# ─────────────────────────────────────────────────────────
def fig_11_vector_projection():
    fig, ax = plt.subplots(figsize=(7.5, 7))
    a = np.array([4, 2])
    b = np.array([2, 0.5])
    proj = (np.dot(a,b)/np.dot(b,b)) * b
    perp = a - proj

    ax.arrow(0,0,a[0],a[1], head_width=0.12, head_length=0.12, fc='#E74C3C', ec='#E74C3C', linewidth=3, zorder=5)
    ax.arrow(0,0,b[0],b[1], head_width=0.1, head_length=0.1, fc='#3498DB', ec='#3498DB', linewidth=2.5, zorder=4)
    ax.arrow(0,0,proj[0],proj[1], head_width=0.12, head_length=0.12, fc='#27AE60', ec='#27AE60', linewidth=3, zorder=4)

    # Dashed perpendicular component
    ax.plot([proj[0],a[0]],[proj[1],a[1]], '--', color='#E67E22', linewidth=2)
    ax.arrow(proj[0],proj[1],perp[0],perp[1], head_width=0.08, head_length=0.08, fc='#E67E22', ec='#E67E22', linewidth=2)

    # Right angle marker
    dx, dy = b/np.linalg.norm(b)*0.25
    ax.plot([proj[0]-dy,proj[0]-dy+dx],[proj[1]+dx,proj[1]+dx+dy], 'k-', linewidth=1.5)

    ax.text(a[0]/2+0.1, a[1]/2-0.3, r'$\vec{a}$', fontsize=13, color='#E74C3C', fontweight='bold')
    ax.text(b[0]/2+0.15, b[1]/2-0.3, r'$\vec{b}$', fontsize=13, color='#3498DB', fontweight='bold')
    ax.text(proj[0]/2-0.3, proj[1]/2-0.3, 'proj', fontsize=11, color='#27AE60', fontweight='bold')
    ax.text((proj[0]+a[0])/2+0.15, (proj[1]+a[1])/2, '⊥ comp', fontsize=10, color='#E67E22')

    ax.annotate(f'proj_b⃗ a⃗ = (a⃗·b⃗/|b⃗|²)·b⃗\n            = ({np.dot(a,b):.1f}/{np.dot(b,b):.2f})·b⃗',
                xy=(2, 3), fontsize=10, bbox=dict(boxstyle='round', facecolor='#D5F5E3', alpha=0.8))

    ax.set_xlim(-0.5, 5); ax.set_ylim(-0.5, 3.5)
    ax.set_aspect('equal'); ax.grid(True, alpha=0.3)
    ax.axhline(0,color='black',lw=0.5); ax.axvline(0,color='black',lw=0.5)
    ax.set_title('Vector Projection: Shadow of a⃗ onto b⃗', fontweight='bold', fontsize=14)
    save_fig(fig, '11-vector-projection.png')

# ─────────────────────────────────────────────────────────
# 12 — Cross Product 3D
# ─────────────────────────────────────────────────────────
def fig_12_cross_product_3d():
    fig = plt.figure(figsize=(10, 8))
    ax = fig.add_subplot(111, projection='3d')

    a = np.array([1, 0, 0])
    b = np.array([0, 1, 0])
    c = np.cross(a, b)

    # Vectors
    ax.quiver(0,0,0, a[0],a[1],a[2], color='#E74C3C', linewidth=3, arrow_length_ratio=0.12, label=r'$\vec{a}=(1,0,0)$')
    ax.quiver(0,0,0, b[0],b[1],b[2], color='#3498DB', linewidth=3, arrow_length_ratio=0.12, label=r'$\vec{b}=(0,1,0)$')
    ax.quiver(0,0,0, c[0],c[1],c[2], color='#27AE60', linewidth=3.5, arrow_length_ratio=0.15, label=r'$\vec{a}\times\vec{b}=(0,0,1)$')

    # Parallelogram
    verts = [[0,0,0], a.tolist(), (a+b).tolist(), b.tolist()]
    poly = Poly3DCollection([verts], alpha=0.3, facecolor='#BDC3C7', edgecolor='gray')
    ax.add_collection3d(poly)

    # Right-hand rule annotation
    ax.text(0,0,1.2, 'R.H. Rule:\nThumb = a⃗×b⃗', fontsize=10, color='#27AE60', fontweight='bold')

    ax.set_xlim([-0.2, 1.5]); ax.set_ylim([-0.2, 1.5]); ax.set_zlim([-0.2, 1.5])
    ax.set_xlabel('X'); ax.set_ylabel('Y'); ax.set_zlabel('Z')
    ax.legend(fontsize=10, loc='upper left')
    ax.set_title('Cross Product: a⃗×b⃗ ⊥ a⃗ and ⊥ b⃗ (Right-Hand Rule)', fontweight='bold', fontsize=13, pad=20)
    ax.view_init(elev=25, azim=-55)
    save_fig(fig, '12-cross-product-3d.png')

# ─────────────────────────────────────────────────────────
# 13 — Cross Product Magnitude = Area
# ─────────────────────────────────────────────────────────
def fig_13_cross_product_area():
    fig, ax = plt.subplots(figsize=(7.5, 7))
    a = np.array([3, 1])
    b = np.array([1, 2.5])

    # Parallelogram
    verts = np.array([[0,0], a, a+b, b])
    ax.fill(verts[:,0], verts[:,1], color='#3498DB', alpha=0.25, edgecolor='#2471A3', linewidth=2)
    ax.arrow(0,0,a[0],a[1], head_width=0.1, head_length=0.1, fc='#E74C3C', ec='#E74C3C', linewidth=2.5)
    ax.arrow(0,0,b[0],b[1], head_width=0.1, head_length=0.1, fc='#3498DB', ec='#3498DB', linewidth=2.5)
    ax.plot([a[0],(a+b)[0]],[a[1],(a+b)[1]], '--', color='#3498DB', alpha=0.5)
    ax.plot([b[0],(a+b)[0]],[b[1],(a+b)[1]], '--', color='#E74C3C', alpha=0.5)

    # Height
    h = np.linalg.norm(a) * np.sin(np.arccos(np.dot(a,b)/(np.linalg.norm(a)*np.linalg.norm(b))))
    base = np.linalg.norm(b)
    area = np.abs(np.cross(np.append(a,0), np.append(b,0))[2])

    ax.annotate(f'Area = |a⃗||b⃗|sin θ = |a⃗×b⃗|\n       = {base:.2f} × {h:.2f}\n       = {area:.2f}',
                xy=(2, 3), fontsize=11, bbox=dict(boxstyle='round', facecolor='#D6EAF8', alpha=0.8))

    ax.text(a[0]/2-0.3, a[1]/2-0.3, r'$\vec{a}$', fontsize=13, color='#E74C3C', fontweight='bold')
    ax.text(b[0]/2-0.3, b[1]/2-0.3, r'$\vec{b}$', fontsize=13, color='#3498DB', fontweight='bold')

    ax.set_xlim(-0.5, 5); ax.set_ylim(-0.5, 4.5)
    ax.set_aspect('equal'); ax.grid(True, alpha=0.3)
    ax.axhline(0,color='black',lw=0.5); ax.axvline(0,color='black',lw=0.5)
    ax.set_title('|a⃗×b⃗| = Parallelogram Area (in 2D, as scalar in z-direction)', fontweight='bold', fontsize=12)
    save_fig(fig, '13-cross-product-area.png')

# ─────────────────────────────────────────────────────────
# 14 — Determinant = Volume in 3D
# ─────────────────────────────────────────────────────────
def fig_14_determinant_volume_3d():
    fig = plt.figure(figsize=(10, 8))
    ax = fig.add_subplot(111, projection='3d')

    A = np.array([[2, 0.5, 0.3],
                  [0.2, 1.8, 0.3],
                  [0.2, 0.1, 1.5]])

    # Unit cube vertices
    cube_verts = np.array([[0,0,0],[1,0,0],[1,1,0],[0,1,0],
                           [0,0,1],[1,0,1],[1,1,1],[0,1,1]])
    # Transformed vertices
    t_verts = np.array([A @ v for v in cube_verts])

    # Draw unit cube (dashed)
    edges = [(0,1),(1,2),(2,3),(3,0),(4,5),(5,6),(6,7),(7,4),(0,4),(1,5),(2,6),(3,7)]
    for i,j in edges:
        ax.plot([cube_verts[i][0],cube_verts[j][0]],
                [cube_verts[i][1],cube_verts[j][1]],
                [cube_verts[i][2],cube_verts[j][2]], '--', color='gray', alpha=0.4, linewidth=1)

    # Draw transformed parallelepiped
    faces = [[0,1,2,3],[4,5,6,7],[0,1,5,4],[2,3,7,6],[0,3,7,4],[1,2,6,5]]
    for face in faces:
        verts_face = [t_verts[i] for i in face]
        poly = Poly3DCollection([verts_face], alpha=0.3, facecolor='#E74C3C', edgecolor='#C0392B', linewidth=1.5)
        ax.add_collection3d(poly)

    # Column vectors
    cols = [A[:,[0]], A[:,[1]], A[:,[2]]]
    colors = ['#E74C3C', '#3498DB', '#27AE60']
    for i, (col, c) in enumerate(zip(cols, colors)):
        ax.quiver(0,0,0, col[0,0], col[1,0], col[2,0], color=c, linewidth=3, arrow_length_ratio=0.1)

    det = np.linalg.det(A)
    ax.set_title(f'3D Determinant = Volume Scale Factor\nUnit Cube → Parallelepiped, det = {det:.2f}',
                 fontweight='bold', fontsize=12, pad=25)
    ax.set_xlabel('X'); ax.set_ylabel('Y'); ax.set_zlabel('Z')
    ax.set_xlim([-0.3, 3]); ax.set_ylim([-0.3, 3]); ax.set_zlim([-0.3, 3])
    ax.view_init(elev=20, azim=-50)
    save_fig(fig, '14-determinant-volume-3d.png')

# ─────────────────────────────────────────────────────────
# 15 — Linear System as Intersection
# ─────────────────────────────────────────────────────────
def fig_15_linear_system():
    fig, axes = plt.subplots(1, 3, figsize=(15, 5))

    # (a) Unique solution
    x = np.linspace(-3, 5, 100)
    axes[0].plot(x, (5-2*x)/3, 'b-', linewidth=2, label='2x+3y=5')
    axes[0].plot(x, (6-x)/4, 'r-', linewidth=2, label='x+4y=6')
    axes[0].plot(0.4, 1.4, 'ko', markersize=10)
    axes[0].annotate('(0.4, 1.4)', (0.4, 1.4), textcoords="offset points", xytext=(10,10), fontsize=10, fontweight='bold')
    axes[0].set_title('Unique Solution\n(Intersection)', fontweight='bold')
    axes[0].legend(fontsize=9); axes[0].grid(True, alpha=0.3)
    axes[0].axhline(0,color='black',lw=0.5); axes[0].axvline(0,color='black',lw=0.5)
    axes[0].set_xlim(-1,4); axes[0].set_ylim(-1,4); axes[0].set_aspect('equal')

    # (b) No solution (parallel)
    axes[1].plot(x, (5-2*x)/3, 'b-', linewidth=2, label='2x+3y=5')
    axes[1].plot(x, (10-2*x)/3, 'r--', linewidth=2, label='2x+3y=10')
    axes[1].set_title('No Solution\n(Parallel Lines)', fontweight='bold')
    axes[1].legend(fontsize=9); axes[1].grid(True, alpha=0.3)
    axes[1].axhline(0,color='black',lw=0.5); axes[1].axvline(0,color='black',lw=0.5)
    axes[1].set_xlim(-1,6); axes[1].set_ylim(-1,5); axes[1].set_aspect('equal')

    # (c) Infinite solutions (same line)
    axes[2].plot(x, (5-2*x)/3, 'b-', linewidth=2, label='2x+3y=5')
    axes[2].plot(x, (10-4*x)/6, 'r--', linewidth=3, alpha=0.5, label='4x+6y=10')
    axes[2].set_title('Infinite Solutions\n(Same Line)', fontweight='bold')
    axes[2].legend(fontsize=9); axes[2].grid(True, alpha=0.3)
    axes[2].axhline(0,color='black',lw=0.5); axes[2].axvline(0,color='black',lw=0.5)
    axes[2].set_xlim(-1,4); axes[2].set_ylim(-1,4); axes[2].set_aspect('equal')

    fig.suptitle('Linear System A⃗x = b⃗: Three Geometric Possibilities', fontsize=14, fontweight='bold')
    plt.tight_layout()
    save_fig(fig, '15-linear-system-geometric.png')

# ─────────────────────────────────────────────────────────
# 16 — Matrix Powers: Repeated Transformations
# ─────────────────────────────────────────────────────────
def fig_16_matrix_powers():
    fig, axes = plt.subplots(1, 5, figsize=(18, 4))
    A = np.array([[0, -1], [1, 0]])  # 90° rotation

    sq = np.array([[0,0],[1,0],[1,1],[0,1],[0,0]])
    v0 = np.array([2, 0.5])

    for k, ax in enumerate(axes):
        Ak = np.linalg.matrix_power(A, k)
        corners = np.array([Ak@[0,0], Ak@[1,0], Ak@[1,0]+Ak@[0,1], Ak@[0,1], [0,0]])
        ax.fill(corners[:,0], corners[:,1], color='#E74C3C', alpha=0.35, edgecolor='#C0392B', linewidth=2)
        vk = Ak @ v0
        ax.arrow(0,0,vk[0],vk[1], head_width=0.1, head_length=0.1, fc='#8E44AD', ec='#8E44AD', linewidth=2.5, zorder=5)
        ax.text(vk[0]/2-0.1, vk[1]/2-0.2, f'v{k}', fontsize=10, color='#8E44AD', fontweight='bold')

        title = 'A⁰ = I (Start)' if k==0 else f'A{k} (Rot {k}×90°={k*90}°)'
        ax.set_title(title, fontsize=9, fontweight='bold')
        ax.set_aspect('equal'); ax.grid(True, alpha=0.25)
        ax.axhline(0,color='black',lw=0.3); ax.axvline(0,color='black',lw=0.3)
        ax.set_xlim(-3, 3); ax.set_ylim(-3, 3)

    fig.suptitle('Matrix Powers = Repeated Transformations: A = Rot 90° → A⁴ = I', fontsize=13, fontweight='bold')
    plt.tight_layout()
    save_fig(fig, '16-matrix-powers-transform.png')

# ─────────────────────────────────────────────────────────
# 17 — 2D → 1D Projection
# ─────────────────────────────────────────────────────────
def fig_17_2d_to_1d_projection():
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5.5))

    # Left: 2D points
    np.random.seed(42)
    pts = np.random.randn(15, 2) * np.array([2, 1]) + np.array([1, 1])
    ax1.scatter(pts[:,0], pts[:,1], c='#3498DB', s=60, edgecolors='#2471A3', zorder=5)
    for i, (x,y) in enumerate(pts):
        ax1.annotate(f'p{i+1}', (x,y), textcoords="offset points", xytext=(3,3), fontsize=7)
    ax1.set_title('2D Point Cloud\n(15 points in ℝ²)', fontweight='bold')
    ax1.set_aspect('equal'); ax1.grid(True, alpha=0.3)
    ax1.axhline(0,color='black',lw=0.5); ax1.axvline(0,color='black',lw=0.5)
    ax1.set_xlim(-5, 5); ax1.set_ylim(-3, 5)
    ax1.arrow(-5,0,10,0, head_width=0.15, head_length=0.15, fc='#E74C3C', ec='#E74C3C', linewidth=2)
    ax1.text(4.5, 0.3, 'projection\ndirection', fontsize=9, color='#E74C3C', ha='center')

    # Right: 1D projections
    proj_vals = pts[:, 0]  # project onto x-axis
    ax2.scatter(proj_vals, np.zeros_like(proj_vals), c='#E74C3C', s=60, edgecolors='#C0392B', zorder=5)
    for i, x in enumerate(proj_vals):
        ax2.annotate(f'p{i+1}', (x,0), textcoords="offset points", xytext=(3,-12), fontsize=7)
    ax2.set_title('1D Projection (onto x-axis)\nℝ² → ℝ¹ via 1×2 matrix [1 0]', fontweight='bold')
    ax2.grid(True, alpha=0.3, axis='x')
    ax2.axhline(0,color='black',lw=0.5)
    ax2.set_xlim(-6, 6); ax2.set_ylim(-1, 1)
    ax2.set_yticks([])
    ax2.arrow(-6,0,12,0, head_width=0.08, head_length=0.15, fc='black', ec='black', linewidth=1.5)
    ax2.set_xlabel('Projected coordinate (1D)')

    fig.suptitle('Dimensionality Reduction: 2D → 1D Projection Matrix', fontsize=13, fontweight='bold')
    plt.tight_layout()
    save_fig(fig, '17-2d-to-1d-projection.png')

# ─────────────────────────────────────────────────────────
# 18 — 3D → 2D Projection
# ─────────────────────────────────────────────────────────
def fig_18_3d_to_2d_projection():
    fig = plt.figure(figsize=(12, 5.5))

    np.random.seed(123)
    pts = np.random.randn(12, 3) * np.array([1.5, 1.5, 0.8]) + np.array([0.5, 0.5, 0.5])

    # Left: 3D view
    ax1 = fig.add_subplot(121, projection='3d')
    ax1.scatter(pts[:,0], pts[:,1], pts[:,2], c='#3498DB', s=60, edgecolors='#2471A3', depthshade=True)
    for i, (x,y,z) in enumerate(pts):
        ax1.text(x,y,z, f'p{i+1}', fontsize=7)
    ax1.set_title('3D Point Cloud (ℝ³)', fontweight='bold')
    ax1.set_xlabel('X'); ax1.set_ylabel('Y'); ax1.set_zlabel('Z')
    ax1.view_init(elev=20, azim=-60)

    # Right: 2D projection (drop z)
    ax2 = fig.add_subplot(122)
    ax2.scatter(pts[:,0], pts[:,1], c='#E74C3C', s=60, edgecolors='#C0392B')
    for i, (x,y) in enumerate(pts[:,:2]):
        ax2.annotate(f'p{i+1}', (x,y), textcoords="offset points", xytext=(3,3), fontsize=7)
    ax2.set_title('2D Projection (drop z-coordinate)\nℝ³ → ℝ² via 2×3 matrix', fontweight='bold')
    ax2.set_aspect('equal'); ax2.grid(True, alpha=0.3)
    ax2.axhline(0,color='black',lw=0.5); ax2.axvline(0,color='black',lw=0.5)
    ax2.set_xlim(-5, 5); ax2.set_ylim(-5, 5)
    ax2.set_xlabel('X'); ax2.set_ylabel('Y')

    fig.suptitle('Dimensionality Reduction: 3D → 2D Projection (PCA-like)', fontsize=13, fontweight='bold')
    plt.tight_layout()
    save_fig(fig, '18-3d-to-2d-projection.png')

# ─────────────────────────────────────────────────────────
# 19 — Dimensionality Cascade nD → 2D
# ─────────────────────────────────────────────────────────
def fig_19_dimensionality_cascade():
    fig, axes = plt.subplots(2, 2, figsize=(11, 10))

    np.random.seed(777)
    titles = [
        'ℝ⁴ → ℝ³\n(Drop 4th dim)',
        'ℝ³ → ℝ²\n(Drop z)',
        'ℝ² → ℝ¹\n(Project onto line)',
        'ℝ¹ → Scalar\n(Summary statistic)',
    ]

    # 4D → 3D: generate 4D data, show first 3 coords
    pts4 = np.random.randn(8, 4) * np.array([1.5,1.5,1,0.5]) + np.array([0.5,0.5,0,0])
    ax0 = fig.add_subplot(221, projection='3d')
    ax0.scatter(pts4[:,0], pts4[:,1], pts4[:,2], c='#9B59B6', s=60, edgecolors='#7D3C98', depthshade=True)
    ax0.set_title(titles[0], fontweight='bold', fontsize=10)
    ax0.set_xlabel('x₁'); ax0.set_ylabel('x₂'); ax0.set_zlabel('x₃')

    # 3D → 2D
    pts3 = np.random.randn(10, 3) * np.array([1.5,1.5,0.8]) + np.array([0.3,0.3,0.2])
    axes[0,1].scatter(pts3[:,0], pts3[:,1], c='#3498DB', s=60, edgecolors='#2471A3')
    axes[0,1].set_title(titles[1], fontweight='bold', fontsize=10)
    axes[0,1].set_aspect('equal'); axes[0,1].grid(True, alpha=0.3)
    axes[0,1].set_xlabel('x'); axes[0,1].set_ylabel('y')

    # 2D → 1D
    pts2 = np.random.randn(10, 2) * np.array([2, 1]) + np.array([1, 0.5])
    proj1d = pts2[:, 0]
    axes[1,0].scatter(proj1d, np.zeros_like(proj1d), c='#E67E22', s=60, edgecolors='#D35400')
    axes[1,0].set_title(titles[2], fontweight='bold', fontsize=10)
    axes[1,0].grid(True, alpha=0.3, axis='x')
    axes[1,0].set_yticks([])
    axes[1,0].set_xlabel('Projected coordinate')

    # 1D → scalar (mean)
    mean_val = np.mean(proj1d)
    axes[1,1].scatter([0], [mean_val], c='#E74C3C', s=200, edgecolors='#C0392B', zorder=5)
    axes[1,1].axhline(mean_val, color='#E74C3C', linewidth=2, alpha=0.5)
    axes[1,1].text(0.5, mean_val, f'Mean = {mean_val:.2f}', fontsize=11, color='#E74C3C', fontweight='bold', ha='center')
    axes[1,1].set_title(titles[3], fontweight='bold', fontsize=10)
    axes[1,1].set_xlim(-1, 1); axes[1,1].set_ylim(-3, 3)
    axes[1,1].set_xticks([])
    axes[1,1].grid(True, alpha=0.3)

    fig.suptitle('Dimensionality Reduction Cascade: nD → (n-1)D → ... → 2D → 1D\nEach step is a matrix multiplication (projection)', fontsize=13, fontweight='bold')
    plt.tight_layout()
    save_fig(fig, '19-dimensionality-cascade.png')

# ─────────────────────────────────────────────────────────
# 20 — Basis Vectors Transformation (Grid Deformation)
# ─────────────────────────────────────────────────────────
def fig_20_basis_transformation_grid():
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5.5))

    A = np.array([[2, 1], [0.5, 1.5]])

    # Left: Original grid
    for i in range(-3, 4):
        ax1.plot([-5, 5], [i, i], '-', color='gray', alpha=0.15, linewidth=0.5)
        ax1.plot([i, i], [-5, 5], '-', color='gray', alpha=0.15, linewidth=0.5)
    # Highlight integer grid
    for i in range(-2, 3):
        ax1.plot([-5, 5], [i, i], '-', color='gray', alpha=0.3, linewidth=0.8)
        ax1.plot([i, i], [-5, 5], '-', color='gray', alpha=0.3, linewidth=0.8)
    # Unit square highlighted
    sq = np.array([[0,0],[1,0],[1,1],[0,1],[0,0]])
    ax1.fill(sq[:,0], sq[:,1], color='#E74C3C', alpha=0.3, edgecolor='#C0392B', linewidth=2)
    ax1.arrow(0,0,1,0, head_width=0.08, head_length=0.08, fc='#E74C3C', ec='#E74C3C', lw=2.5)
    ax1.arrow(0,0,0,1, head_width=0.08, head_length=0.08, fc='#3498DB', ec='#3498DB', lw=2.5)
    ax1.set_title('Original Space (ℝ²)\nRegular grid + unit square', fontweight='bold')
    ax1.set_aspect('equal'); ax1.set_xlim(-3, 5); ax1.set_ylim(-3, 5)

    # Right: Transformed grid
    # Transform grid lines
    for i in range(-2, 3):
        for t in np.linspace(-5, 5, 50):
            pass  # too dense — transform corners

    # Transform the integer grid (selected lines)
    for i in range(-2, 4):
        pts_h = np.column_stack([np.linspace(-5, 5, 30), np.full(30, i)])
        pts_v = np.column_stack([np.full(30, i), np.linspace(-5, 5, 30)])
        t_h = pts_h @ A.T
        t_v = pts_v @ A.T
        ax2.plot(t_h[:,0], t_h[:,1], '-', color='gray', alpha=0.15, linewidth=0.5)
        ax2.plot(t_v[:,0], t_v[:,1], '-', color='gray', alpha=0.15, linewidth=0.5)
    for i in range(-1, 3):
        pts_h2 = np.column_stack([np.linspace(-5, 5, 30), np.full(30, i)])
        pts_v2 = np.column_stack([np.full(30, i), np.linspace(-5, 5, 30)])
        t_h2 = pts_h2 @ A.T
        t_v2 = pts_v2 @ A.T
        ax2.plot(t_h2[:,0], t_h2[:,1], '-', color='gray', alpha=0.3, linewidth=0.8)
        ax2.plot(t_v2[:,0], t_v2[:,1], '-', color='gray', alpha=0.3, linewidth=0.8)

    t_sq = sq @ A.T
    ax2.fill(t_sq[:,0], t_sq[:,1], color='#E74C3C', alpha=0.3, edgecolor='#C0392B', linewidth=2)
    e1 = A @ [1,0]; e2 = A @ [0,1]
    ax2.arrow(0,0,e1[0],e1[1], head_width=0.08, head_length=0.08, fc='#E74C3C', ec='#E74C3C', lw=2.5)
    ax2.arrow(0,0,e2[0],e2[1], head_width=0.08, head_length=0.08, fc='#3498DB', ec='#3498DB', lw=2.5)
    ax2.set_title('Transformed Space (A applied)\nGrid deforms, unit square → parallelogram', fontweight='bold')
    ax2.set_aspect('equal'); ax2.set_xlim(-3, 8); ax2.set_ylim(-3, 8)

    fig.suptitle('Matrix as Grid Deformation: Every Point (x,y) → A(x,y)', fontsize=13, fontweight='bold')
    plt.tight_layout()
    save_fig(fig, '20-basis-transformation-grid.png')

# ─────────────────────────────────────────────────────────
# Generate all figures
# ─────────────────────────────────────────────────────────
if __name__ == '__main__':
    print("Generating graphs for 12A2 — Matrices and Vectors...")
    fig_01_matrix_transformation()
    fig_02_determinant_area()
    fig_03_matrix_multiplication()
    fig_04_inverse_matrix()
    fig_05_rotation_matrix()
    fig_06_reflection_matrix()
    fig_07_shear_matrix()
    fig_08_vector_addition()
    fig_09_vector_magnitude()
    fig_10_dot_product()
    fig_11_vector_projection()
    fig_12_cross_product_3d()
    fig_13_cross_product_area()
    fig_14_determinant_volume_3d()
    fig_15_linear_system()
    fig_16_matrix_powers()
    fig_17_2d_to_1d_projection()
    fig_18_3d_to_2d_projection()
    fig_19_dimensionality_cascade()
    fig_20_basis_transformation_grid()
    print(f"Done! All graphs saved to {OUTPUT_DIR}/")
