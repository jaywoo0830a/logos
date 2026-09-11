#!/usr/bin/env python3
"""Generate all graph images for Session 9C: 3D Geometry."""
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from mpl_toolkits.mplot3d import Axes3D
from mpl_toolkits.mplot3d.art3d import Poly3DCollection
import numpy as np
import os

OUT = os.path.dirname(os.path.abspath(__file__)) + "/9C"
os.makedirs(OUT, exist_ok=True)

plt.rcParams.update({
    'figure.dpi': 150,
    'font.size': 10,
    'axes.titlesize': 12,
    'axes.labelsize': 10,
})

def save(name):
    plt.tight_layout(pad=1.5)
    plt.savefig(f"{OUT}/{name}", bbox_inches='tight', facecolor='white', edgecolor='none')
    plt.close()
    print(f"  ✓ {name}")

# ============================================================
# 9c-coordinate-system-3d.png
# ============================================================
def fig_coordinate_system_3d():
    fig = plt.figure(figsize=(10, 9))
    ax = fig.add_subplot(111, projection='3d')
    # Axes
    ax.quiver(0,0,0, 5,0,0, color='red', arrow_length_ratio=0.1, linewidth=2)
    ax.quiver(0,0,0, 0,5,0, color='green', arrow_length_ratio=0.1, linewidth=2)
    ax.quiver(0,0,0, 0,0,5, color='blue', arrow_length_ratio=0.1, linewidth=2)
    ax.text(5.5,0,0,'x',fontsize=14,color='red',fontweight='bold')
    ax.text(0,5.5,0,'y',fontsize=14,color='green',fontweight='bold')
    ax.text(0,0,5.5,'z',fontsize=14,color='blue',fontweight='bold')
    # Coordinate planes (translucent)
    xx, yy = np.meshgrid(np.linspace(0,4,10), np.linspace(0,4,10))
    ax.plot_surface(xx, yy, np.zeros_like(xx), alpha=0.08, color='gray')
    ax.plot_surface(xx, np.zeros_like(xx), yy, alpha=0.08, color='gray')
    ax.plot_surface(np.zeros_like(xx), xx, yy, alpha=0.08, color='gray')
    # Point (3,2,4)
    ax.plot([3],[2],[4], 'ro', markersize=10, zorder=5)
    ax.plot([3,3],[2,2],[0,4], 'k--', lw=0.8, alpha=0.5)
    ax.plot([3,3],[0,2],[0,0], 'k--', lw=0.8, alpha=0.5)
    ax.plot([0,3],[0,0],[0,0], 'k--', lw=0.8, alpha=0.5)
    ax.text(3,2,4.5,'(3,2,4)',fontsize=12,fontweight='bold')
    # Octant I label
    ax.text(2,2,2,'Octant I\n(+,+,+)',fontsize=9,color='gray',ha='center')
    ax.set_xlabel('X'); ax.set_ylabel('Y'); ax.set_zlabel('Z')
    ax.set_title('3D Coordinate System', fontsize=14, fontweight='bold')
    ax.set_xlim(0,6); ax.set_ylim(0,6); ax.set_zlim(0,6)
    ax.view_init(elev=25, azim=-50)
    save('9c-coordinate-system-3d.png')

# ============================================================
# 9c-step-3d-coords.png
# ============================================================
def fig_step_3d_coords():
    fig = plt.figure(figsize=(15, 5))
    titles = ['Step 1: Move along x to (3,0,0)', 'Step 2: Move along y to (3,2,0)', 'Step 3: Rise along z to (3,2,4)']
    points = [[(3,0,0)], [(3,0,0),(3,2,0)], [(3,0,0),(3,2,0),(3,2,4)]]
    for i in range(3):
        ax = fig.add_subplot(1, 3, i+1, projection='3d')
        ax.quiver(0,0,0, 5,0,0, color='red', arrow_length_ratio=0.05, lw=1.5)
        ax.quiver(0,0,0, 0,5,0, color='green', arrow_length_ratio=0.05, lw=1.5)
        ax.quiver(0,0,0, 0,0,5, color='blue', arrow_length_ratio=0.05, lw=1.5)
        prev = (0,0,0)
        for pt in points[i]:
            ax.plot([prev[0],pt[0]],[prev[1],pt[1]],[prev[2],pt[2]],'k-',lw=2)
            prev = pt
        ax.plot([pt[0]],[pt[1]],[pt[2]],'ro',markersize=8,zorder=5)
        # Dashed vertical
        if i >= 1:
            ax.plot([3,3],[2,2],[0,4],'k--',lw=0.8,alpha=0.4)
        ax.set_title(titles[i], fontweight='bold', fontsize=10)
        ax.set_xlim(0,5); ax.set_ylim(0,5); ax.set_zlim(0,5)
        ax.set_xlabel('X'); ax.set_ylabel('Y'); ax.set_zlabel('Z')
        ax.view_init(elev=25, azim=-50)
    fig.suptitle('Plotting a Point in 3D — Step by Step', fontsize=14, fontweight='bold')
    save('9c-step-3d-coords.png')

# ============================================================
# 9c-vector-dot-cross.png
# ============================================================
def fig_vector_dot_cross():
    fig = plt.figure(figsize=(14, 6))
    # Left: Dot product (2D representation)
    ax1 = fig.add_subplot(1, 2, 1)
    ax1.quiver(0,0, 3,1, angles='xy', scale_units='xy', scale=1, color='blue', width=0.015, label='u=(3,1)')
    ax1.quiver(0,0, 1,3, angles='xy', scale_units='xy', scale=1, color='red', width=0.015, label='v=(1,3)')
    # Angle arc
    theta = np.arctan2(1,3); phi = np.arctan2(3,1)
    arc_t = np.linspace(theta, phi, 50)
    ax1.plot(0.8*np.cos(arc_t), 0.8*np.sin(arc_t), 'purple', lw=2)
    ax1.text(0.9, 1.0, 'θ', fontsize=14, color='purple')
    ax1.text(2, 2, 'u·v = |u||v|cosθ\nmeasures alignment', fontsize=11, ha='center',
             bbox=dict(boxstyle='round',facecolor='wheat',alpha=0.8))
    ax1.legend(fontsize=10); ax1.grid(True,alpha=0.3)
    ax1.set_xlim(-0.5,4.5); ax1.set_ylim(-0.5,4.5); ax1.set_aspect('equal')
    ax1.set_title('Dot Product: Alignment', fontweight='bold')
    # Right: Cross product (3D)
    ax2 = fig.add_subplot(1, 2, 2, projection='3d')
    ax2.quiver(0,0,0, 2,0,0, color='blue', lw=2, arrow_length_ratio=0.15)
    ax2.quiver(0,0,0, 0,2,0, color='red', lw=2, arrow_length_ratio=0.15)
    ax2.quiver(0,0,0, 0,0,2, color='purple', lw=3, arrow_length_ratio=0.15)
    ax2.text(2.2,0,0,'u (1,0,0)',fontsize=10,color='blue')
    ax2.text(0,2.2,0,'v (0,1,0)',fontsize=10,color='red')
    ax2.text(0,0,2.3,'u×v (0,0,1)',fontsize=10,color='purple')
    ax2.text(1,1,0.5,'⊥ to both\nArea = |u||v|sinθ',fontsize=10,ha='center',
             bbox=dict(boxstyle='round',facecolor='wheat',alpha=0.7))
    ax2.set_xlim(0,3); ax2.set_ylim(0,3); ax2.set_zlim(0,3)
    ax2.set_xlabel('X'); ax2.set_ylabel('Y'); ax2.set_zlabel('Z')
    ax2.set_title('Cross Product: Perpendicular', fontweight='bold')
    ax2.view_init(elev=20, azim=-60)
    fig.suptitle('Dot Product and Cross Product', fontsize=14, fontweight='bold')
    save('9c-vector-dot-cross.png')

# ============================================================
# 9c-step-vectors.png
# ============================================================
def fig_step_vectors():
    fig = plt.figure(figsize=(15, 5))
    titles = ['Step 1: Vector from origin', 'Step 2: Vector addition\n(u+v, tip-to-tail)', 'Step 3: Cross product\n(u×v, perpendicular)']
    for i in range(3):
        ax = fig.add_subplot(1, 3, i+1, projection='3d')
        if i == 0:
            ax.quiver(0,0,0, 3,1,2, color='blue', lw=2, arrow_length_ratio=0.1)
            ax.text(3.3,1.1,2.3,'v=(3,1,2)',fontsize=10,color='blue')
        elif i == 1:
            ax.quiver(0,0,0, 3,1,2, color='blue', lw=2, arrow_length_ratio=0.1)
            ax.quiver(3,1,2, 1,2,1, color='red', lw=2, arrow_length_ratio=0.1)
            ax.quiver(0,0,0, 4,3,3, color='purple', lw=2.5, arrow_length_ratio=0.1)
            ax.text(4.3,3.1,3.3,'u+v',fontsize=10,color='purple')
        else:
            ax.quiver(0,0,0, 2,0,0, color='blue', lw=2, arrow_length_ratio=0.1)
            ax.quiver(0,0,0, 0,1,0, color='red', lw=2, arrow_length_ratio=0.1)
            ax.quiver(0,0,0, 0,0,2, color='purple', lw=3, arrow_length_ratio=0.1)
            # semi-transparent plane
            xx,yy = np.meshgrid(np.linspace(0,2,5), np.linspace(0,1,5))
            ax.plot_surface(xx, yy, np.zeros_like(xx), alpha=0.15, color='gray')
            ax.text(0,0,2.3,'u×v',fontsize=11,color='purple',fontweight='bold')
        ax.set_xlim(0,6); ax.set_ylim(0,6); ax.set_zlim(0,6)
        ax.set_xlabel('X'); ax.set_ylabel('Y'); ax.set_zlabel('Z')
        ax.set_title(titles[i], fontweight='bold', fontsize=10)
        ax.view_init(elev=20, azim=-50)
    fig.suptitle('Vectors in 3D — Step by Step', fontsize=14, fontweight='bold')
    save('9c-step-vectors.png')

# ============================================================
# 9c-plane-intercept.png
# ============================================================
def fig_plane_intercept():
    fig = plt.figure(figsize=(11, 9))
    ax = fig.add_subplot(111, projection='3d')
    # Plane: 2x+3y-z=6  => z = 2x+3y-6
    # High-resolution mesh for smooth rendering
    x = np.linspace(0, 5, 80); y = np.linspace(0, 4, 80)
    X, Y = np.meshgrid(x, y)
    Z = 2*X + 3*Y - 6
    # Only show plane where it's within the visible z-range
    plane = np.ones_like(Z)
    plane[(Z < -7) | (Z > 5)] = np.nan
    ax.plot_surface(X, Y, plane * Z, rstride=1, cstride=1, alpha=0.5, 
                    color='#87CEEB', shade=True, antialiased=True, edgecolor='none')
    # Intercepts
    ax.plot([3],[0],[0],'ro',markersize=12, zorder=10)
    ax.plot([0],[2],[0],'go',markersize=12, zorder=10)
    ax.plot([0],[0],[-6],'mo',markersize=12, zorder=10)
    # Label intercepts with nice offset
    ax.text(3.3,-0.2,-0.3,'(3,0,0)',fontsize=11,color='red',fontweight='bold')
    ax.text(-0.3,2.3,-0.3,'(0,2,0)',fontsize=11,color='green',fontweight='bold')
    ax.text(-0.3,0.3,-6.3,'(0,0,−6)',fontsize=11,color='magenta',fontweight='bold')
    # Normal vector
    ax.quiver(1,1,-1, 2,3,-1, color='darkred', lw=3, arrow_length_ratio=0.2)
    ax.text(2.2,3.2,-2.2,'$\\vec{n}=(2,3,-1)$',fontsize=11,color='darkred',fontweight='bold')
    # Axes
    ax.quiver(0,0,0, 6,0,0, color='gray', arrow_length_ratio=0.05, lw=1)
    ax.quiver(0,0,0, 0,5,0, color='gray', arrow_length_ratio=0.05, lw=1)
    ax.quiver(0,0,0, 0,0,5, color='gray', arrow_length_ratio=0.05, lw=1)
    ax.text(5.8,0,0,'x',fontsize=12); ax.text(0,5.3,0,'y',fontsize=12); ax.text(0,0,5.5,'z',fontsize=12)
    ax.set_xlim(0,5.5); ax.set_ylim(0,5); ax.set_zlim(-7,1)
    ax.set_xlabel(''); ax.set_ylabel(''); ax.set_zlabel('')
    ax.set_title('Plane: $2x+3y-z=6$ — Intercepts + Normal Vector', fontsize=13, fontweight='bold')
    ax.view_init(elev=22, azim=-55)
    ax.xaxis.pane.fill = False; ax.yaxis.pane.fill = False; ax.zaxis.pane.fill = False
    ax.xaxis.pane.set_edgecolor('w'); ax.yaxis.pane.set_edgecolor('w'); ax.zaxis.pane.set_edgecolor('w')
    save('9c-plane-intercept.png')

# ============================================================
# 9c-plane-normal.png
# ============================================================
def fig_plane_normal():
    fig = plt.figure(figsize=(11, 9))
    ax = fig.add_subplot(111, projection='3d')
    x = np.linspace(-1, 5, 80); y = np.linspace(-1, 5, 80)
    X, Y = np.meshgrid(x, y)
    Z = 2*X + 3*Y - 6
    plane = np.ones_like(Z)
    plane[(Z < -8) | (Z > 6)] = np.nan
    ax.plot_surface(X, Y, plane * Z, rstride=1, cstride=1, alpha=0.35, 
                    color='#87CEEB', shade=True, antialiased=True, edgecolor='none')
    # Normal vectors at three points on the plane
    pts = [(1,1,-1),(3,0,0),(0,2,0)]
    for px,py,pz in pts:
        ax.quiver(px,py,pz, 2,3,-1, color='#8B0000', lw=2.5, arrow_length_ratio=0.25, alpha=0.8)
    # Lines in the plane (showing vectors perpendicular to normal)
    for t in np.linspace(0,3.5,4):
        ax.plot([t, t+1.5], [0, 0], [-6+2*t, -6+2*(t+1.5)], 'k-', lw=1.5, alpha=0.4)
    for t in np.linspace(0,3,4):
        ax.plot([t, t], [0, 1.5], [-6+2*t, -6+2*t+1.5*-3], 'k-', lw=1.5, alpha=0.4)
    # Axes
    ax.quiver(0,0,0, 5,0,0, color='gray', arrow_length_ratio=0.05, lw=1)
    ax.quiver(0,0,0, 0,5,0, color='gray', arrow_length_ratio=0.05, lw=1)
    ax.quiver(0,0,-6, 0,0,3, color='gray', arrow_length_ratio=0.05, lw=1)
    ax.text(5.2,0,0,'x',fontsize=12); ax.text(0,5.3,0,'y',fontsize=12)
    # Annotation
    ax.text(2, 3.5, -2, '$\\vec{n}=(2,3,-1)$\n$\\perp$ to every direction in the plane', 
            fontsize=11, ha='center',
            bbox=dict(boxstyle='round',facecolor='#FFE4B5',alpha=0.85,edgecolor='#D2691E'))
    ax.set_xlim(-0.5,5.5); ax.set_ylim(-0.5,5); ax.set_zlim(-7,2)
    ax.set_title('Normal Vector $\\perp$ to Plane', fontsize=13, fontweight='bold')
    ax.view_init(elev=18, azim=-50)
    ax.xaxis.pane.fill = False; ax.yaxis.pane.fill = False; ax.zaxis.pane.fill = False
    ax.xaxis.pane.set_edgecolor('w'); ax.yaxis.pane.set_edgecolor('w'); ax.zaxis.pane.set_edgecolor('w')
    save('9c-plane-normal.png')

# ============================================================
# 9c-step-plane.png
# ============================================================
def fig_step_plane():
    fig = plt.figure(figsize=(15, 5))
    titles = ['Step 1: Three points\nA(1,0,0),B(0,2,0),C(0,0,3)',
              'Step 2: AB×AC = normal\nn=(6,3,2)',
              'Step 3: Plane 6x+3y+2z=6\nx/1+y/2+z/3=1']
    for i in range(3):
        ax = fig.add_subplot(1, 3, i+1, projection='3d')
        ax.plot([1],[0],[0],'ro',markersize=10)
        ax.plot([0],[2],[0],'go',markersize=10)
        ax.plot([0],[0],[3],'mo',markersize=10)
        ax.text(1,0,0.3,'A',fontsize=11,color='red',fontweight='bold')
        ax.text(0,2,0.3,'B',fontsize=11,color='green',fontweight='bold')
        ax.text(0,0,3.3,'C',fontsize=11,color='magenta',fontweight='bold')
        ax.quiver(0,0,0, 5,0,0, color='gray', arrow_length_ratio=0.05, lw=0.5)
        ax.quiver(0,0,0, 0,4,0, color='gray', arrow_length_ratio=0.05, lw=0.5)
        ax.quiver(0,0,0, 0,0,5, color='gray', arrow_length_ratio=0.05, lw=0.5)
        if i >= 1:
            ax.quiver(1,0,0, -1,2,0, color='orange', lw=2.5, arrow_length_ratio=0.2)
            ax.quiver(1,0,0, -1,0,3, color='orange', lw=2.5, arrow_length_ratio=0.2)
            ax.quiver(1,0,0, 6,3,2, color='darkred', lw=3.5, arrow_length_ratio=0.2)
            ax.text(4,1.5,1.5,'$\\vec{n}=(6,3,2)$',fontsize=9,color='darkred',fontweight='bold')
            ax.text(1.5,1.5,1,'$\\vec{AB}$',fontsize=8,color='orange')
            ax.text(1.5,0.5,2,'$\\vec{AC}$',fontsize=8,color='orange')
        if i == 2:
            xx,yy = np.meshgrid(np.linspace(0,1.5,40), np.linspace(0,2.5,40))
            zz = (6-6*xx-3*yy)/2
            zz[zz<0] = np.nan
            zz[zz>4] = np.nan
            ax.plot_surface(xx, yy, zz, alpha=0.45, color='#87CEEB', shade=True, edgecolor='none')
        ax.set_title(titles[i], fontweight='bold', fontsize=10)
        ax.set_xlim(-0.2,5); ax.set_ylim(-0.2,4); ax.set_zlim(-0.2,5)
        ax.set_xlabel('X'); ax.set_ylabel('Y'); ax.set_zlabel('Z')
        ax.view_init(elev=20, azim=-50)
    fig.suptitle('Building a Plane from 3 Points', fontsize=14, fontweight='bold')
    save('9c-step-plane.png')

# ============================================================
# 9c-point-plane-distance.png
# ============================================================
def fig_point_plane_distance():
    fig = plt.figure(figsize=(11, 9))
    ax = fig.add_subplot(111, projection='3d')
    # Plane: 2x+3y+z=6 → z = 6-2x-3y
    # Use a domain that shows the relevant portion
    xx,yy = np.meshgrid(np.linspace(-0.5,4,60), np.linspace(-0.5,4,60))
    zz = 6 - 2*xx - 3*yy
    # Mask out extreme values to keep a clean visible region
    zz_masked = zz.copy()
    zz_masked[(zz < -0.5) | (zz > 7)] = np.nan
    ax.plot_surface(xx, yy, zz_masked, alpha=0.35, color='#87CEEB', 
                    shade=True, antialiased=True, edgecolor='none')
    # Point P(1,2,3)
    ax.plot([1],[2],[3],'ro',markersize=12, zorder=10)
    ax.text(1.3,2.3,3.5,'$P(1,2,3)$',fontsize=12,color='red',fontweight='bold')
    # Foot of perpendicular
    n = np.array([2,3,1])
    p0 = np.array([1,2,3])
    d_const = 6
    t_val = (d_const - np.dot(n, p0)) / np.dot(n, n)
    foot = p0 + t_val * n
    # Perpendicular line (dashed, thick)  
    ax.plot([1,foot[0]],[2,foot[1]],[3,foot[2]],'r--',lw=3)
    ax.plot([foot[0]],[foot[1]],[foot[2]],'go',markersize=12, zorder=10)
    # Distance label
    mid = (p0 + foot) / 2
    ax.text(mid[0]+0.1, mid[1]+0.1, mid[2], '$d = \\frac{5}{\\sqrt{14}} \\approx 1.336$', 
            fontsize=11, color='red', fontweight='bold',
            bbox=dict(boxstyle='round',facecolor='white',alpha=0.7,edgecolor='red'))
    # Normal vector
    ax.quiver(foot[0],foot[1],foot[2], 2,3,1, color='purple', lw=2.5, arrow_length_ratio=0.2,
             label='$\\vec{n}=(2,3,1)$')
    ax.legend(fontsize=10, loc='upper right')
    # Axes
    ax.quiver(0,0,0, 5,0,0, color='gray', arrow_length_ratio=0.05, lw=0.8)
    ax.quiver(0,0,0, 0,5,0, color='gray', arrow_length_ratio=0.05, lw=0.8)
    ax.quiver(0,0,0, 0,0,5, color='gray', arrow_length_ratio=0.05, lw=0.8)
    ax.text(5.2,0,0,'x',fontsize=12); ax.text(0,5.3,0,'y',fontsize=12); ax.text(0,0,5.5,'z',fontsize=12)
    ax.set_xlim(-0.5,4.5); ax.set_ylim(-0.5,4.5); ax.set_zlim(-0.5,6)
    ax.set_title('Point-to-Plane Distance: $D = \\frac{|2x_0+3y_0+z_0-6|}{\\sqrt{2^2+3^2+1^2}}$', 
                fontsize=12, fontweight='bold')
    ax.view_init(elev=22, azim=-55)
    ax.xaxis.pane.fill = False; ax.yaxis.pane.fill = False; ax.zaxis.pane.fill = False
    ax.xaxis.pane.set_edgecolor('w'); ax.yaxis.pane.set_edgecolor('w'); ax.zaxis.pane.set_edgecolor('w')
    save('9c-point-plane-distance.png')

# ============================================================
# 9c-angle-planes.png
# ============================================================
def fig_angle_planes():
    fig = plt.figure(figsize=(14, 6))
    # Left: 60° planes
    ax1 = fig.add_subplot(1, 2, 1, projection='3d')
    xx,yy = np.meshgrid(np.linspace(-2,2,15), np.linspace(-2,2,15))
    z1 = np.zeros_like(xx)
    z2 = np.sqrt(3)*xx
    ax1.plot_surface(xx, yy, z1, alpha=0.4, color='lightblue')
    ax1.plot_surface(xx, yy, z2, alpha=0.4, color='lightcoral')
    ax1.quiver(0,0,0, 0,0,1, color='blue', lw=2.5, arrow_length_ratio=0.2)
    ax1.quiver(0,0,0, -np.sqrt(3),0,1, color='red', lw=2.5, arrow_length_ratio=0.2)
    ax1.text(0,0.5,1.3,'n₁',color='blue',fontsize=11)
    ax1.text(-1.5,0.5,0.7,'n₂',color='red',fontsize=11)
    ax1.text(0,0.3,0.5,'60°',fontsize=13,color='purple',fontweight='bold')
    ax1.set_title('Planes at 60°', fontweight='bold')
    ax1.set_xlim(-2,2); ax1.set_ylim(-2,2); ax1.set_zlim(-1,3)
    ax1.view_init(elev=25, azim=-50)
    # Right: perpendicular planes
    ax2 = fig.add_subplot(1, 2, 2, projection='3d')
    ax2.plot_surface(xx, yy, np.zeros_like(xx), alpha=0.4, color='lightblue')
    ax2.plot_surface(np.zeros_like(xx), xx, yy, alpha=0.4, color='lightcoral')
    ax2.quiver(1,0,0, 0,0,1.5, color='blue', lw=2.5, arrow_length_ratio=0.2)
    ax2.quiver(0,1,0, 1.5,0,0, color='red', lw=2.5, arrow_length_ratio=0.2)
    ax2.text(1,0.3,1.8,'n₁',color='blue',fontsize=11)
    ax2.text(1.8,1,0,'n₂',color='red',fontsize=11)
    ax2.text(1,1,1,'90°\nn₁·n₂=0',fontsize=12,color='purple',fontweight='bold',ha='center')
    ax2.set_title('Perpendicular Planes', fontweight='bold')
    ax2.set_xlim(-2,2); ax2.set_ylim(-2,2); ax2.set_zlim(-1,2)
    ax2.view_init(elev=25, azim=-50)
    fig.suptitle('Angle Between Planes = Angle Between Normals', fontsize=14, fontweight='bold')
    save('9c-angle-planes.png')

# ============================================================
# 9c-distance-parallel-planes.png
# ============================================================
def fig_distance_parallel_planes():
    fig = plt.figure(figsize=(10, 9))
    ax = fig.add_subplot(111, projection='3d')
    xx,yy = np.meshgrid(np.linspace(-3,3,20), np.linspace(-3,3,20))
    z1 = (5-2*xx+yy)/2
    z2 = (-7-2*xx+yy)/2
    ax.plot_surface(xx, yy, z1, alpha=0.3, color='lightblue')
    ax.plot_surface(xx, yy, z2, alpha=0.3, color='lightcoral')
    # Perpendicular segment
    pt1 = np.array([0.5,0.5,(5-2*0.5+0.5)/2])
    pt2 = np.array([0.5,0.5,(-7-2*0.5+0.5)/2])
    ax.plot([pt1[0],pt2[0]],[pt1[1],pt2[1]],[pt1[2],pt2[2]],'r-',lw=3)
    mid = (pt1+pt2)/2
    ax.text(mid[0]+0.3,mid[1],mid[2],'D = 4',fontsize=13,color='red',fontweight='bold')
    ax.quiver(0,0,0, 2,-1,2, color='purple', lw=2, arrow_length_ratio=0.15)
    ax.text(1.5,-0.5,1.5,'n=(2,−1,2)',fontsize=10,color='purple')
    ax.set_xlim(-2,3); ax.set_ylim(-2,3); ax.set_zlim(-6,4)
    ax.set_title('Distance Between Parallel Planes\n2x−y+2z=5 and 2x−y+2z=−7', fontsize=13, fontweight='bold')
    ax.view_init(elev=15, azim=-55)
    save('9c-distance-parallel-planes.png')

# ============================================================
# 9c-sphere-details.png
# ============================================================
def fig_sphere_details():
    fig = plt.figure(figsize=(10, 9))
    ax = fig.add_subplot(111, projection='3d')
    u = np.linspace(0, 2*np.pi, 40); v = np.linspace(0, np.pi, 30)
    cx, cy, cz, R = 2, -3, 1, 5
    x = cx + R*np.outer(np.cos(u), np.sin(v))
    y = cy + R*np.outer(np.sin(u), np.sin(v))
    z = cz + R*np.outer(np.ones(np.size(u)), np.cos(v))
    ax.plot_wireframe(x, y, z, color='blue', alpha=0.3, lw=0.3)
    ax.plot([cx],[cy],[cz],'ro',markersize=10,zorder=5)
    ax.text(cx,cy,cz+1,'C(2,−3,1)',fontsize=11,color='red',fontweight='bold')
    # Great circles
    for ang in [0, np.pi/2]:
        t = np.linspace(0, 2*np.pi, 100)
        ax.plot(cx+R*np.cos(t), cy+R*np.sin(t)*np.cos(ang), cz+R*np.sin(t)*np.sin(ang), 'k-', lw=0.6, alpha=0.5)
    # Radius line
    ax.plot([cx,cx+R],[cy,cy],[cz,cz],'r--',lw=2)
    ax.text(cx+R/2,cy+0.3,cz+0.3,'R=5',fontsize=11,color='red')
    ax.set_xlim(cx-R-1,cx+R+1); ax.set_ylim(cy-R-1,cy+R+1); ax.set_zlim(cz-R-1,cz+R+1)
    ax.set_xlabel('X'); ax.set_ylabel('Y'); ax.set_zlabel('Z')
    ax.set_title('Sphere: $(x-2)^2+(y+3)^2+(z-1)^2=25$', fontsize=14, fontweight='bold')
    ax.view_init(elev=20, azim=-50)
    save('9c-sphere-details.png')

# ============================================================
# 9c-point-sphere-distance.png
# ============================================================
def fig_point_sphere_distance():
    fig = plt.figure(figsize=(14, 6))
    # Outside
    ax1 = fig.add_subplot(1, 2, 1)
    theta = np.linspace(0, 2*np.pi, 200)
    ax1.plot(5*np.cos(theta), 5*np.sin(theta), 'b-', lw=2.5)
    ax1.plot(0,0,'ko',markersize=5)
    ax1.plot(10,0,'ro',markersize=8)
    ax1.plot([10,5],[0,0],'r--',lw=2)
    ax1.plot(5,0,'go',markersize=7)
    ax1.text(10.3,0.5,'P(10,0,0)',fontsize=11)
    ax1.text(7,1,'d=10−5=5',fontsize=13,color='red',fontweight='bold')
    ax1.set_title('Point Outside\n$d=|PC|-R$', fontweight='bold')
    ax1.set_aspect('equal'); ax1.grid(True,alpha=0.3)
    ax1.set_xlim(-2,12); ax1.set_ylim(-7,7)
    # Inside
    ax2 = fig.add_subplot(1, 2, 2)
    ax2.plot(5*np.cos(theta), 5*np.sin(theta), 'b-', lw=2.5)
    ax2.plot(0,0,'ko',markersize=5)
    ax2.plot(2,0,'ro',markersize=8)
    ax2.plot([2,5],[0,0],'r--',lw=2)
    ax2.plot(5,0,'go',markersize=7)
    ax2.text(2.3,0.5,'P(2,0,0)',fontsize=11)
    ax2.text(3.5,1,'d=5−2=3',fontsize=13,color='red',fontweight='bold')
    ax2.set_title('Point Inside\n$d=R-|PC|$', fontweight='bold')
    ax2.set_aspect('equal'); ax2.grid(True,alpha=0.3)
    ax2.set_xlim(-2,12); ax2.set_ylim(-7,7)
    fig.suptitle('Point-to-Sphere Distance', fontsize=14, fontweight='bold')
    save('9c-point-sphere-distance.png')

# ============================================================
# 9c-surface-height-map.png
# ============================================================
def fig_surface_height_map():
    fig = plt.figure(figsize=(10, 9))
    ax = fig.add_subplot(111, projection='3d')
    x = np.linspace(-2, 2, 40); y = np.linspace(-2, 2, 40)
    X, Y = np.meshgrid(x, y)
    Z = X**2 + Y**2
    ax.plot_surface(X, Y, Z, alpha=0.6, cmap='viridis', edgecolor='none')
    # Point (1,1,2)
    ax.plot([1],[1],[2],'ro',markersize=10,zorder=5)
    ax.plot([1,1],[1,1],[0,2],'r--',lw=1.5)
    ax.plot([0,1],[0,1],[0,0],'k--',lw=0.8,alpha=0.5)
    ax.text(1.3,1.3,2.5,'(1,1,f(1,1)=2)',fontsize=10,color='red',fontweight='bold')
    ax.set_xlabel('X'); ax.set_ylabel('Y'); ax.set_zlabel('Z = f(x,y)')
    ax.set_title('$z = x^2 + y^2$ — Height Map', fontsize=14, fontweight='bold')
    ax.view_init(elev=25, azim=-50)
    save('9c-surface-height-map.png')

# ============================================================
# 9c-step-surface-build.png
# ============================================================
def fig_step_surface_build():
    fig = plt.figure(figsize=(15, 5))
    x = np.linspace(-2, 2, 30); y = np.linspace(-2, 2, 30)
    X, Y = np.meshgrid(x, y)
    Z = X**2 + Y**2
    titles = ['Step 1: Wireframe Skeleton', 'Step 2: Solid Surface', 'Step 3: Level Curves Added']
    for i in range(3):
        ax = fig.add_subplot(1, 3, i+1, projection='3d')
        if i == 0:
            ax.plot_wireframe(X, Y, Z, color='blue', alpha=0.4, lw=0.3)
        elif i == 2:
            ax.plot_surface(X, Y, Z, alpha=0.6, cmap='viridis')
        else:
            ax.plot_surface(X, Y, Z, alpha=0.6, cmap='viridis', lw=0.1)
        if i == 2:
            for cz in [1,2,3,4]:
                t = np.linspace(0, 2*np.pi, 100)
                r = np.sqrt(cz)
                ax.plot(r*np.cos(t), r*np.sin(t), np.full_like(t, cz), 'white', lw=1.5)
        ax.plot([0],[0],[0],'ro',markersize=6)
        ax.set_title(titles[i], fontweight='bold', fontsize=11)
        ax.set_xlabel('X'); ax.set_ylabel('Y'); ax.set_zlabel('Z')
        ax.view_init(elev=25, azim=-50)
    fig.suptitle('Building a 3D Surface — $z=x^2+y^2$', fontsize=14, fontweight='bold')
    save('9c-step-surface-build.png')

# ============================================================
# 9c-domain-regions.png
# ============================================================
def fig_domain_regions():
    fig, axes = plt.subplots(2, 2, figsize=(12, 11))
    titles = ['$z=\\sqrt{4-x^2-y^2}$\nDisk $x^2+y^2\\leq 4$',
              '$z=\\ln(x+y)$\nHalf-plane $x+y>0$',
              '$z=1/(x^2+y^2-1)$\nPlane minus unit circle',
              '$z=\\sqrt{x}/(y-1)$\n$x\\geq 0, y\\neq 1$']
    # (1) Disk
    ax = axes[0,0]
    theta = np.linspace(0, 2*np.pi, 200)
    ax.fill(np.cos(theta)*2, np.sin(theta)*2, alpha=0.2, color='blue')
    ax.plot(np.cos(theta)*2, np.sin(theta)*2, 'b-', lw=2.5)
    ax.set_title(titles[0], fontweight='bold', fontsize=10)
    ax.set_aspect('equal'); ax.grid(True,alpha=0.3); ax.set_xlim(-3,3); ax.set_ylim(-3,3)
    ax.axhline(0,color='gray',lw=0.5); ax.axvline(0,color='gray',lw=0.5)
    # (2) Half-plane
    ax = axes[0,1]
    x = np.linspace(-3, 3, 100)
    ax.fill_between(x, -x, 4, alpha=0.2, color='green')
    ax.plot(x, -x, 'g--', lw=2.5)
    ax.set_title(titles[1], fontweight='bold', fontsize=10)
    ax.set_aspect('equal'); ax.grid(True,alpha=0.3); ax.set_xlim(-3,3); ax.set_ylim(-3,4)
    ax.axhline(0,color='gray',lw=0.5); ax.axvline(0,color='gray',lw=0.5)
    # (3) Plane minus circle
    ax = axes[1,0]
    ax.fill_between(np.linspace(-3,3,50), -3, 3, alpha=0.08, color='orange')
    ax.add_patch(plt.Circle((0,0), 1, fill=True, color='white', zorder=2))
    ax.add_patch(plt.Circle((0,0), 1, fill=False, color='orange', lw=2.5, linestyle='--', zorder=3))
    ax.set_title(titles[2], fontweight='bold', fontsize=10)
    ax.set_aspect('equal'); ax.grid(True,alpha=0.3); ax.set_xlim(-3,3); ax.set_ylim(-3,3)
    ax.axhline(0,color='gray',lw=0.5); ax.axvline(0,color='gray',lw=0.5)
    # (4) Intersection
    ax = axes[1,1]
    ax.fill_between(np.linspace(0,4,50), -2, 2, alpha=0.15, color='purple')
    ax.axhline(1, color='purple', linestyle='--', lw=2)
    ax.set_title(titles[3], fontweight='bold', fontsize=10)
    ax.set_aspect('equal'); ax.grid(True,alpha=0.3); ax.set_xlim(-1,4); ax.set_ylim(-2,3)
    ax.axhline(0,color='gray',lw=0.5); ax.axvline(0,color='gray',lw=0.5)
    ax.axvline(0,color='purple',alpha=0.5,lw=3)
    fig.suptitle('Domain Regions in the xy-Plane', fontsize=14, fontweight='bold')
    save('9c-domain-regions.png')

# ============================================================
# 9c-level-curves-method.png
# ============================================================
def fig_level_curves_method():
    fig, axes = plt.subplots(2, 2, figsize=(12, 11))
    titles = ['$z=x^2+y^2$ (Bowl)\nConcentric circles',
              '$z=x^2-y^2$ (Saddle)\nHyperbolas',
              '$z=\\sqrt{x^2+y^2}$ (Cone)\nEvenly spaced circles',
              '$z=y-x^2$ (Parabolic cylinder)\nShifted parabolas']
    data = [
        lambda c: (np.sqrt(c), 'circle'),  # bowl
        lambda c: (np.sqrt(abs(c)), 'hyperbola'),  # saddle
        lambda c: (c, 'circle'),  # cone
        lambda c: (None, 'parabola'),  # parabolic cylinder
    ]
    cs = [-2,-1,0,1,2]
    colors = ['darkblue','blue','black','red','darkred']
    for idx, (ax, title) in enumerate(zip(axes.flat, titles)):
        for ci, c in enumerate(cs):
            if idx == 0:  # Bowl
                if c < 0: continue
                if c == 0:
                    ax.plot(0,0,'ko',markersize=6)
                else:
                    t = np.linspace(0, 2*np.pi, 200)
                    ax.plot(np.sqrt(c)*np.cos(t), np.sqrt(c)*np.sin(t), color=colors[ci], lw=1.8)
            elif idx == 1:  # Saddle
                xr = np.linspace(-3, 3, 300)
                if c == 0:
                    ax.plot(xr, xr, 'k-', lw=2)
                    ax.plot(xr, -xr, 'k-', lw=2)
                elif c > 0:
                    ax.plot(xr, np.sqrt(xr**2 - c), color=colors[ci], lw=1.5)
                    ax.plot(xr, -np.sqrt(xr**2 - c), color=colors[ci], lw=1.5)
                else:
                    ax.plot(np.sqrt(xr**2 + abs(c)), xr, color=colors[ci], lw=1.5)
                    ax.plot(-np.sqrt(xr**2 + abs(c)), xr, color=colors[ci], lw=1.5)
            elif idx == 2:  # Cone
                if c < 0: continue
                t = np.linspace(0, 2*np.pi, 200)
                ax.plot(c*np.cos(t), c*np.sin(t), color=colors[ci], lw=1.8)
                if c == 0: ax.plot(0,0,'ko',markersize=6)
            elif idx == 3:  # Parabolic cylinder
                xp = np.linspace(-3, 3, 100)
                ax.plot(xp, xp**2 + c, color=colors[ci], lw=1.8)
        ax.set_title(title, fontweight='bold', fontsize=10)
        ax.set_aspect('equal'); ax.grid(True,alpha=0.3)
        ax.axhline(0,color='gray',lw=0.5); ax.axvline(0,color='gray',lw=0.5)
        ax.set_xlim(-3,3); ax.set_ylim(-3,3)
    fig.suptitle('Level Curves of Four Key Surfaces', fontsize=14, fontweight='bold')
    save('9c-level-curves-method.png')

# ============================================================
# 9c-level-curves-to-surface.png
# ============================================================
def fig_level_curves_to_surface():
    fig = plt.figure(figsize=(14, 9))
    # Left column: level curves, right column: 3D
    # Top: bowl
    ax1 = fig.add_subplot(2, 2, 1)
    for c in [0.5, 1, 1.5, 2, 2.5]:
        t = np.linspace(0, 2*np.pi, 200)
        ax1.plot(np.sqrt(c)*np.cos(t), np.sqrt(c)*np.sin(t), 'b-', lw=1.2, alpha=0.7)
    ax1.set_title('Level Curves: $z=x^2+y^2$\nConcentric circles', fontweight='bold', fontsize=10)
    ax1.set_aspect('equal'); ax1.grid(True,alpha=0.3); ax1.set_xlim(-2,2); ax1.set_ylim(-2,2)
    
    ax2 = fig.add_subplot(2, 2, 2, projection='3d')
    x = np.linspace(-2, 2, 30); y = np.linspace(-2, 2, 30)
    X, Y = np.meshgrid(x, y); Z = X**2+Y**2
    ax2.plot_surface(X, Y, Z, alpha=0.6, cmap='viridis')
    for c in [1,2,3,4]:
        t = np.linspace(0, 2*np.pi, 100)
        ax2.plot(np.sqrt(c)*np.cos(t), np.sqrt(c)*np.sin(t), np.full_like(t,c), 'white', lw=1.2)
    ax2.set_title('3D: $z=x^2+y^2$ (Bowl)', fontweight='bold', fontsize=10)
    ax2.view_init(elev=25, azim=-50)
    
    # Bottom: saddle
    ax3 = fig.add_subplot(2, 2, 3)
    xr = np.linspace(-2, 2, 300)
    for c in [-2,-1,0,1,2]:
        color = plt.cm.coolwarm((c+2)/4)
        if c == 0:
            ax3.plot(xr, xr, 'k-', lw=2); ax3.plot(xr, -xr, 'k-', lw=2)
        elif c > 0:
            ax3.plot(xr, np.sqrt(np.maximum(xr**2-c,0)), color=color, lw=1.2)
            ax3.plot(xr, -np.sqrt(np.maximum(xr**2-c,0)), color=color, lw=1.2)
        else:
            ax3.plot(np.sqrt(xr**2+abs(c)), xr, color=color, lw=1.2)
            ax3.plot(-np.sqrt(xr**2+abs(c)), xr, color=color, lw=1.2)
    ax3.set_title('Level Curves: $z=x^2-y^2$\nHyperbolas', fontweight='bold', fontsize=10)
    ax3.set_aspect('equal'); ax3.grid(True,alpha=0.3); ax3.set_xlim(-3,3); ax3.set_ylim(-2,2)
    
    ax4 = fig.add_subplot(2, 2, 4, projection='3d')
    X2,Y2 = np.meshgrid(np.linspace(-2,2,30), np.linspace(-2,2,30))
    Z2 = X2**2 - Y2**2
    ax4.plot_surface(X2, Y2, Z2, alpha=0.6, cmap='coolwarm')
    for c in [-3,-1.5,0,1.5,3]:
        t = np.linspace(0, 2*np.pi, 100)
        rx = np.sqrt(np.maximum(abs(c),0.1))
        ax4.plot(rx*np.cosh(t), rx*np.sinh(t), np.full_like(t,c), 'white', lw=1, alpha=0.6)
    ax4.set_title('3D: $z=x^2-y^2$ (Saddle)', fontweight='bold', fontsize=10)
    ax4.view_init(elev=25, azim=-50)
    
    fig.suptitle('From Level Curves to 3D Surface', fontsize=14, fontweight='bold')
    save('9c-level-curves-to-surface.png')

# ============================================================
# 9c-contour-steepness.png
# ============================================================
def fig_contour_steepness():
    fig = plt.figure(figsize=(14, 6))
    # Left: Steep - close contours
    ax1 = fig.add_subplot(1, 2, 1)
    for c in [0.2,0.4,0.6,0.8,1.0,1.2,1.4,1.6,1.8,2.0]:
        t = np.linspace(0, 2*np.pi, 200)
        ax1.plot(np.sqrt(c)*np.cos(t), np.sqrt(c)*np.sin(t), 'b-', lw=0.8)
    ax1.set_title('Tight Contours → Steep Slope\nLike a cliff', fontweight='bold')
    ax1.set_aspect('equal'); ax1.grid(True,alpha=0.3); ax1.set_xlim(-2,2); ax1.set_ylim(-2,2)
    # Right: Flat - wide contours
    ax2 = fig.add_subplot(1, 2, 2)
    for c in [0.5,1.5,2.5,3.5,4.5]:
        t = np.linspace(0, 2*np.pi, 200)
        ax2.plot(np.sqrt(c)*np.cos(t), np.sqrt(c)*np.sin(t), 'b-', lw=1.5)
    ax2.set_title('Wide Contours → Gentle Slope\nLike a plain', fontweight='bold')
    ax2.set_aspect('equal'); ax2.grid(True,alpha=0.3); ax2.set_xlim(-3,3); ax2.set_ylim(-3,3)
    fig.suptitle('Contour Spacing Reveals Steepness', fontsize=14, fontweight='bold')
    save('9c-contour-steepness.png')

# ============================================================
# 9c-step-level-curves.png
# ============================================================
def fig_step_level_curves():
    fig = plt.figure(figsize=(15, 4.8))
    titles = ['Step 1: Draw $f(x,y)=c$\nfor c=−2,−1,0,1,2',
              'Step 2: Color-code\nBlue=low, Red=high',
              'Step 3: Stack into 3D\nSaddle emerges']
    for idx in range(3):
        if idx < 2:
            ax = fig.add_subplot(1, 3, idx+1)
            xr = np.linspace(-3, 3, 300)
            cs = [-2,-1,0,1,2]
            colors_2d = ['darkblue','blue','black','red','darkred']
            for ci, c in enumerate(cs):
                color = colors_2d[ci]
                if c == 0:
                    ax.plot(xr, xr, color=color, lw=2)
                    ax.plot(xr, -xr, color=color, lw=2)
                elif c > 0:
                    ax.plot(xr, np.sqrt(np.maximum(xr**2-c,0)), color=color, lw=1.5)
                    ax.plot(xr, -np.sqrt(np.maximum(xr**2-c,0)), color=color, lw=1.5)
                else:
                    ax.plot(np.sqrt(xr**2+abs(c)), xr, color=color, lw=1.5)
                    ax.plot(-np.sqrt(xr**2+abs(c)), xr, color=color, lw=1.5)
            ax.set_title(titles[idx], fontweight='bold', fontsize=10)
            ax.set_aspect('equal'); ax.grid(True,alpha=0.3); ax.set_xlim(-3,3); ax.set_ylim(-2.5,2.5)
        else:
            ax = fig.add_subplot(1, 3, 3, projection='3d')
            X,Y = np.meshgrid(np.linspace(-2,2,30), np.linspace(-2,2,30))
            Z = X**2 - Y**2
            ax.plot_surface(X, Y, Z, alpha=0.6, cmap='coolwarm')
            ax.set_title(titles[idx], fontweight='bold', fontsize=10)
            ax.view_init(elev=25, azim=-50)
    fig.suptitle('Level Curve Analysis — $z=x^2-y^2$ (Saddle)', fontsize=14, fontweight='bold')
    save('9c-step-level-curves.png')

# ============================================================
# 9c-quadric-identification.png
# ============================================================
def fig_quadric_identification():
    fig = plt.figure(figsize=(14, 11))
    surfaces = [
        ('Ellipsoid\n$\\frac{x^2}{a^2}+\\frac{y^2}{b^2}+\\frac{z^2}{c^2}=1$', '+++', 231),
        ('Hyperboloid\n1 Sheet\n$\\frac{x^2}{a^2}+\\frac{y^2}{b^2}-\\frac{z^2}{c^2}=1$', '++−', 232),
        ('Hyperboloid\n2 Sheets\n$-\\frac{x^2}{a^2}-\\frac{y^2}{b^2}+\\frac{z^2}{c^2}=1$', '−−+', 233),
        ('Elliptic\nParaboloid\n$z=\\frac{x^2}{a^2}+\\frac{y^2}{b^2}$', 'z=++', 234),
        ('Hyperbolic\nParaboloid\n$z=\\frac{x^2}{a^2}-\\frac{y^2}{b^2}$', 'z=+−', 235),
        ('Cone\n$\\frac{x^2}{a^2}+\\frac{y^2}{b^2}-\\frac{z^2}{c^2}=0$', '++−=0', 236),
    ]
    for name, pattern, subplot_idx in surfaces:
        ax = fig.add_subplot(subplot_idx, projection='3d')
        u = np.linspace(0, 2*np.pi, 30); v = np.linspace(0, np.pi, 20)
        if 'Ellipsoid' in name and 'Hyperboloid' not in name and 'Paraboloid' not in name and 'Cone' not in name:
            a,b,c=2,1.5,1
            x=a*np.outer(np.cos(u),np.sin(v)); y=b*np.outer(np.sin(u),np.sin(v)); z=c*np.outer(np.ones(np.size(u)),np.cos(v))
            ax.plot_wireframe(x,y,z,color='blue',alpha=0.5,lw=0.2)
        elif '1 Sheet' in name:
            a,b,c=1,1,2
            v2=np.linspace(-2,2,30); u2=np.linspace(0,2*np.pi,30)
            U2,V2=np.meshgrid(u2,v2)
            X=a*np.cosh(V2)*np.cos(U2); Y=b*np.cosh(V2)*np.sin(U2); Z=c*np.sinh(V2)
            ax.plot_wireframe(X,Y,Z,color='blue',alpha=0.5,lw=0.2)
        elif '2 Sheets' in name:
            a,b,c=1,1,1.5
            v2=np.concatenate([np.linspace(-2,-0.7,15),np.linspace(0.7,2,15)])
            u2=np.linspace(0,2*np.pi,30)
            U2,V2=np.meshgrid(u2,v2)
            X=a*np.sinh(V2)*np.cos(U2); Y=b*np.sinh(V2)*np.sin(U2); Z=c*np.cosh(V2)
            ax.plot_wireframe(X,Y,Z,color='blue',alpha=0.5,lw=0.2)
        elif 'Elliptic\nParaboloid' in name:
            x=np.linspace(-2,2,20); y=np.linspace(-2,2,20)
            X,Y=np.meshgrid(x,y); Z=X**2+Y**2
            ax.plot_wireframe(X,Y,Z,color='blue',alpha=0.5,lw=0.2)
        elif 'Hyperbolic\nParaboloid' in name:
            x=np.linspace(-2,2,20); y=np.linspace(-2,2,20)
            X,Y=np.meshgrid(x,y); Z=X**2-Y**2
            ax.plot_wireframe(X,Y,Z,color='blue',alpha=0.5,lw=0.2)
        elif 'Cone' in name:
            v2=np.linspace(-2,2,20); u2=np.linspace(0,2*np.pi,30)
            U2,V2=np.meshgrid(u2,v2)
            X=V2*np.cos(U2); Y=V2*np.sin(U2); Z=V2
            ax.plot_wireframe(X,Y,Z,color='blue',alpha=0.5,lw=0.2)
        ax.set_title(f'{name}\nSign: {pattern}', fontsize=9, fontweight='bold')
        ax.view_init(elev=20, azim=-50)
        ax.set_axis_off()
    fig.suptitle('Quadric Surfaces — Sign Pattern Identification', fontsize=15, fontweight='bold')
    save('9c-quadric-identification.png')

# ============================================================
# Helper: ellipsoid
# ============================================================
def plot_ellipsoid(ax, a, b, c):
    u = np.linspace(0, 2*np.pi, 30); v = np.linspace(0, np.pi, 20)
    x = a*np.outer(np.cos(u), np.sin(v))
    y = b*np.outer(np.sin(u), np.sin(v))
    z = c*np.outer(np.ones(np.size(u)), np.cos(v))
    ax.plot_wireframe(x, y, z, color='blue', alpha=0.4, lw=0.2)
    return x, y, z

# ============================================================
# 9c-ellipsoid-details.png
# ============================================================
def fig_ellipsoid_details():
    fig = plt.figure(figsize=(14, 6))
    ax1 = fig.add_subplot(1, 2, 1, projection='3d')
    a,b,c = 2, 3, 1
    x,y,z = plot_ellipsoid(ax1, a, b, c)
    ax1.plot([a,-a],[0,0],[0,0],'ro',markersize=6)
    ax1.plot([0,0],[b,-b],[0,0],'go',markersize=6)
    ax1.plot([0,0],[0,0],[c,-c],'mo',markersize=6)
    ax1.text(a+0.3,0,0,'a=2',fontsize=10,color='red')
    ax1.text(0,b+0.3,0,'b=3',fontsize=10,color='green')
    ax1.text(0,0,c+0.3,'c=1',fontsize=10,color='magenta')
    ax1.set_title('Ellipsoid\n$x^2/4+y^2/9+z^2=1$', fontweight='bold')
    ax1.view_init(elev=20, azim=-50)
    # Right: cross-sections
    ax2 = fig.add_subplot(1, 2, 2, projection='3d')
    plot_ellipsoid(ax2, a, b, c)
    # z=0 cross section (xy-plane)
    t = np.linspace(0, 2*np.pi, 100)
    ax2.plot(a*np.cos(t), b*np.sin(t), np.zeros_like(t), 'r-', lw=2.5, label='z=0: ellipse')
    # x=0 cross section (yz-plane)
    ax2.plot(np.zeros_like(t), b*np.cos(t), c*np.sin(t), 'g-', lw=2.5, label='x=0: ellipse')
    # y=0 cross section (xz-plane)
    ax2.plot(a*np.cos(t), np.zeros_like(t), c*np.sin(t), 'm-', lw=2.5, label='y=0: ellipse')
    ax2.legend(fontsize=8)
    ax2.set_title('Three Orthogonal Cross-Sections', fontweight='bold')
    ax2.view_init(elev=20, azim=-50)
    fig.suptitle('Ellipsoid — The 3D Ellipse', fontsize=14, fontweight='bold')
    save('9c-ellipsoid-details.png')

# ============================================================
# 9c-paraboloid-details.png
# ============================================================
def fig_paraboloid_details():
    fig = plt.figure(figsize=(14, 6))
    ax1 = fig.add_subplot(1, 2, 1, projection='3d')
    x = np.linspace(-2, 2, 30); y = np.linspace(-2, 2, 30)
    X, Y = np.meshgrid(x, y); Z = X**2 + 2*Y**2
    ax1.plot_wireframe(X, Y, Z, color='blue', alpha=0.4, lw=0.2)
    ax1.plot([0],[0],[0],'ro',markersize=8)
    ax1.text(0,0,0.5,'Vertex (0,0,0)',fontsize=10,color='red')
    ax1.set_title('Elliptic Paraboloid\n$z=x^2+2y^2$', fontweight='bold')
    ax1.view_init(elev=20, azim=-50)
    # Right: cross sections
    ax2 = fig.add_subplot(1, 2, 2, projection='3d')
    ax2.plot_wireframe(X, Y, Z, color='blue', alpha=0.3, lw=0.2)
    xp = np.linspace(-2, 2, 50)
    ax2.plot(xp, np.zeros_like(xp), xp**2, 'r-', lw=2.5, label='y=0: $z=x^2$')
    ax2.plot(np.zeros_like(xp), xp, 2*xp**2, 'g-', lw=2.5, label='x=0: $z=2y^2$')
    # Level curves
    for cz in [1,2,3,4]:
        t = np.linspace(0, 2*np.pi, 100)
        ax2.plot(np.sqrt(cz)*np.cos(t), np.sqrt(cz/2)*np.sin(t), np.full_like(t,cz), 'white', lw=1)
    ax2.legend(fontsize=8)
    ax2.set_title('Cross-Sections: Parabolas\nLevel Curves: Ellipses', fontweight='bold')
    ax2.view_init(elev=20, azim=-50)
    fig.suptitle('Elliptic Paraboloid — The 3D Bowl', fontsize=14, fontweight='bold')
    save('9c-paraboloid-details.png')

# ============================================================
# 9c-hyperbolic-paraboloid-details.png
# ============================================================
def fig_hyperbolic_paraboloid_details():
    fig = plt.figure(figsize=(14, 6))
    ax1 = fig.add_subplot(1, 2, 1, projection='3d')
    x = np.linspace(-2, 2, 30); y = np.linspace(-2, 2, 30)
    X, Y = np.meshgrid(x, y); Z = X**2 - Y**2
    ax1.plot_wireframe(X, Y, Z, color='blue', alpha=0.4, lw=0.2)
    xp = np.linspace(-2, 2, 50)
    ax1.plot(xp, np.zeros_like(xp), xp**2, 'r-', lw=2.5)
    ax1.plot(np.zeros_like(xp), xp, -xp**2, 'b-', lw=2.5)
    ax1.plot([0],[0],[0],'ko',markersize=8)
    ax1.text(0,0,0.8,'Saddle\nPoint',fontsize=9,color='black',ha='center')
    ax1.set_title('Hyperbolic Paraboloid\n$z=x^2-y^2$', fontweight='bold')
    ax1.view_init(elev=20, azim=-50)
    # Right: level curves
    ax2 = fig.add_subplot(1, 2, 2, projection='3d')
    ax2.plot_wireframe(X, Y, Z, color='blue', alpha=0.2, lw=0.2)
    # Show level curves at different heights
    for cz in [-3, -1.5, 0, 1.5, 3]:
        t = np.linspace(-2, 2, 50)
        if cz == 0:
            ax2.plot(t, t, np.full_like(t,0), 'k-', lw=2)
            ax2.plot(t, -t, np.full_like(t,0), 'k-', lw=2)
        elif cz > 0:
            ax2.plot(np.sqrt(t**2+cz), t, np.full_like(t,cz), 'red', lw=1.5)
            ax2.plot(-np.sqrt(t**2+cz), t, np.full_like(t,cz), 'red', lw=1.5)
        else:
            ax2.plot(t, np.sqrt(t**2+abs(cz)), np.full_like(t,cz), 'blue', lw=1.5)
            ax2.plot(t, -np.sqrt(t**2+abs(cz)), np.full_like(t,cz), 'blue', lw=1.5)
    ax2.set_title('Level Curves: Hyperbolas\nCrossing lines at z=0', fontweight='bold')
    ax2.view_init(elev=20, azim=-50)
    fig.suptitle('Hyperbolic Paraboloid — The Saddle', fontsize=14, fontweight='bold')
    save('9c-hyperbolic-paraboloid-details.png')

# ============================================================
# 9c-cylinder-types.png
# ============================================================
def fig_cylinder_types():
    fig, axes = plt.subplots(2, 2, figsize=(12, 10), subplot_kw={'projection': '3d'})
    titles = ['Circular Cylinder\n$x^2+y^2=1$', 'Sinusoidal Cylinder\n$z=\\sin x$',
              'Elliptic Cylinder\n$x^2/4+z^2/9=1$', 'Parabolic Cylinder\n$y=x^2$']
    for ax, title in zip(axes.flat, titles):
        if 'Circular' in title:
            z = np.linspace(-3, 3, 30); t = np.linspace(0, 2*np.pi, 40)
            T, Z = np.meshgrid(t, z)
            X = np.cos(T); Y = np.sin(T)
            ax.plot_wireframe(X, Y, Z, color='blue', alpha=0.4, lw=0.2)
        elif 'Sinusoidal' in title:
            x = np.linspace(-4, 4, 50); y = np.linspace(-3, 3, 20)
            X, Y = np.meshgrid(x, y); Z = np.sin(X)
            ax.plot_wireframe(X, Y, Z, color='blue', alpha=0.4, lw=0.2)
        elif 'Elliptic' in title:
            y = np.linspace(-3, 3, 30); t = np.linspace(0, 2*np.pi, 40)
            T, Y = np.meshgrid(t, y)
            X = 2*np.cos(T); Z = 3*np.sin(T)
            ax.plot_wireframe(X, Y, Z, color='blue', alpha=0.4, lw=0.2)
        elif 'Parabolic' in title:
            x = np.linspace(-3, 3, 40); z = np.linspace(-3, 3, 20)
            X, Z = np.meshgrid(x, z); Y = X**2
            ax.plot_wireframe(X, Y, Z, color='blue', alpha=0.4, lw=0.2)
        ax.set_title(title, fontweight='bold', fontsize=10)
        ax.view_init(elev=20, azim=-50)
        ax.set_xlabel('X'); ax.set_ylabel('Y'); ax.set_zlabel('Z')
    fig.suptitle('Four Types of Cylinders', fontsize=14, fontweight='bold')
    save('9c-cylinder-types.png')

# ============================================================
# 9c-hyperboloid-one-sheet.png
# ============================================================
def fig_hyperboloid_one_sheet():
    fig = plt.figure(figsize=(14, 6))
    ax1 = fig.add_subplot(1, 2, 1, projection='3d')
    u = np.linspace(0, 2*np.pi, 40); v = np.linspace(-2, 2, 30)
    U, V = np.meshgrid(u, v)
    X = np.cosh(V)*np.cos(U); Y = np.cosh(V)*np.sin(U); Z = 2*np.sinh(V)
    ax1.plot_wireframe(X, Y, Z, color='blue', alpha=0.4, lw=0.2)
    ax1.set_title('Hyperboloid of One Sheet\n$x^2+y^2-z^2/4=1$\nConnected — Cooling Tower', fontweight='bold')
    ax1.view_init(elev=20, azim=-50)
    # Right: cross-sections
    ax2 = fig.add_subplot(1, 2, 2, projection='3d')
    ax2.plot_wireframe(X, Y, Z, color='blue', alpha=0.3, lw=0.2)
    for z_val in [0, 1, 2]:
        t = np.linspace(0, 2*np.pi, 100)
        r = np.sqrt(1 + (z_val/2)**2)
        ax2.plot(r*np.cos(t), r*np.sin(t), np.full_like(t, z_val), 'r-', lw=2)
    ax2.set_title('Cross-sections: z=0 (waist), z=1, z=2\nAll ellipses, growing as |z|↑', fontweight='bold', fontsize=10)
    ax2.view_init(elev=20, azim=-50)
    fig.suptitle('Hyperboloid of One Sheet (Connected)', fontsize=14, fontweight='bold')
    save('9c-hyperboloid-one-sheet.png')

# ============================================================
# 9c-hyperboloid-two-sheets.png
# ============================================================
def fig_hyperboloid_two_sheets():
    fig = plt.figure(figsize=(14, 6))
    ax1 = fig.add_subplot(1, 2, 1, projection='3d')
    u = np.linspace(0, 2*np.pi, 30)
    v_top = np.linspace(0.7, 2, 15); v_bot = np.linspace(-2, -0.7, 15)
    for v_range in [v_top, v_bot]:
        U, V = np.meshgrid(u, v_range)
        X = np.sinh(V)*np.cos(U); Y = np.sinh(V)*np.sin(U); Z = 2*np.cosh(V)
        ax1.plot_wireframe(X, Y, Z, color='blue', alpha=0.4, lw=0.2)
    ax1.set_title('Hyperboloid of Two Sheets\n$-x^2-y^2+z^2/4=1$\nDisconnected — Two Bowls', fontweight='bold')
    ax1.view_init(elev=20, azim=-50)
    # Right: gap
    ax2 = fig.add_subplot(1, 2, 2, projection='3d')
    for v_range in [v_top, v_bot]:
        U, V = np.meshgrid(u, v_range)
        X = np.sinh(V)*np.cos(U); Y = np.sinh(V)*np.sin(U); Z = 2*np.cosh(V)
        ax2.plot_wireframe(X, Y, Z, color='blue', alpha=0.4, lw=0.2)
    ax2.text(0,0,0,'GAP\n|z|<2\nno points',fontsize=12,ha='center',color='red',fontweight='bold')
    ax2.set_title('Gap: $|z|<2$ has NO real points', fontweight='bold')
    ax2.view_init(elev=20, azim=-50)
    fig.suptitle('Hyperboloid of Two Sheets (Disconnected)', fontsize=14, fontweight='bold')
    save('9c-hyperboloid-two-sheets.png')

# ============================================================
# 9c-cone-details.png
# ============================================================
def fig_cone_details():
    fig = plt.figure(figsize=(14, 6))
    ax1 = fig.add_subplot(1, 2, 1, projection='3d')
    u = np.linspace(0, 2*np.pi, 40); v = np.linspace(-2, 2, 30)
    U, V = np.meshgrid(u, v)
    X = V*np.cos(U); Y = V*np.sin(U); Z = V
    ax1.plot_wireframe(X, Y, Z, color='blue', alpha=0.4, lw=0.2)
    ax1.plot([0],[0],[0],'ro',markersize=8)
    ax1.text(0,0,0.5,'Vertex\n(0,0,0)',fontsize=10,color='red',ha='center')
    ax1.set_title('Double Cone\n$z^2=x^2+y^2$', fontweight='bold')
    ax1.view_init(elev=20, azim=-50)
    # Right: cross-sections
    ax2 = fig.add_subplot(1, 2, 2, projection='3d')
    ax2.plot_wireframe(X, Y, Z, color='blue', alpha=0.25, lw=0.2)
    for z_val in [-2, -1, 0, 1, 2]:
        t = np.linspace(0, 2*np.pi, 100)
        r = abs(z_val)
        if r == 0:
            ax2.plot([0],[0],[0],'ko',markersize=8)
        else:
            ax2.plot(r*np.cos(t), r*np.sin(t), np.full_like(t, z_val), 'r-', lw=2)
    ax2.set_title('Cross-sections: Circles\nRadius grows linearly: r=|z|', fontweight='bold', fontsize=10)
    ax2.view_init(elev=20, azim=-50)
    fig.suptitle('Double Cone — Two Nappes', fontsize=14, fontweight='bold')
    save('9c-cone-details.png')

# ============================================================
# 9c-quadric-comparison.png
# ============================================================
def fig_quadric_comparison():
    fig = plt.figure(figsize=(15, 10))
    specs = [
        ('Ellipsoid', 241, 'ellipsoid'),
        ('Elliptic\nParaboloid', 242, 'paraboloid'),
        ('Hyperbolic\nParaboloid', 243, 'saddle'),
        ('Cylinder', 244, 'cylinder'),
        ('Hyperboloid\n1 Sheet', 245, 'hyper1'),
        ('Cone', 246, 'cone'),
    ]
    for name, subplot_idx, stype in specs:
        ax = fig.add_subplot(subplot_idx, projection='3d')
        if stype == 'ellipsoid':
            a,b,c=2,1.5,1
            u=np.linspace(0,2*np.pi,25);v=np.linspace(0,np.pi,15)
            x=a*np.outer(np.cos(u),np.sin(v));y=b*np.outer(np.sin(u),np.sin(v));z=c*np.outer(np.ones(np.size(u)),np.cos(v))
            ax.plot_wireframe(x,y,z,color='blue',alpha=0.5,lw=0.2)
        elif stype == 'paraboloid':
            x=np.linspace(-1.5,1.5,15);y=np.linspace(-1.5,1.5,15)
            X,Y=np.meshgrid(x,y);Z=X**2+Y**2
            ax.plot_wireframe(X,Y,Z,color='blue',alpha=0.5,lw=0.2)
        elif stype == 'saddle':
            x=np.linspace(-1.5,1.5,15);y=np.linspace(-1.5,1.5,15)
            X,Y=np.meshgrid(x,y);Z=X**2-Y**2
            ax.plot_wireframe(X,Y,Z,color='blue',alpha=0.5,lw=0.2)
        elif stype == 'cylinder':
            z=np.linspace(-2,2,15);t=np.linspace(0,2*np.pi,25)
            T,Z=np.meshgrid(t,z)
            X=np.cos(T);Y=np.sin(T)
            ax.plot_wireframe(X,Y,Z,color='blue',alpha=0.5,lw=0.2)
        elif stype == 'hyper1':
            u=np.linspace(0,2*np.pi,25);v=np.linspace(-1.5,1.5,15)
            U,V=np.meshgrid(u,v)
            X=np.cosh(V)*np.cos(U);Y=np.cosh(V)*np.sin(U);Z=1.5*np.sinh(V)
            ax.plot_wireframe(X,Y,Z,color='blue',alpha=0.5,lw=0.2)
        elif stype == 'cone':
            u=np.linspace(0,2*np.pi,25);v=np.linspace(-1.5,1.5,15)
            U,V=np.meshgrid(u,v)
            X=V*np.cos(U);Y=V*np.sin(U);Z=V
            ax.plot_wireframe(X,Y,Z,color='blue',alpha=0.5,lw=0.2)
        ax.set_title(name, fontsize=9, fontweight='bold')
        ax.view_init(elev=20, azim=-50)
        ax.set_axis_off()
    fig.suptitle('Quadric Surfaces — Complete Gallery', fontsize=15, fontweight='bold')
    save('9c-quadric-comparison.png')

# ============================================================
# 9c-degenerate-cases.png
# ============================================================
def fig_degenerate_cases():
    fig = plt.figure(figsize=(14, 5))
    titles = ['$x^2+y^2+z^2=0$\n→ Single Point (0,0,0)',
              '$x^2+y^2=0$\n→ The z-axis (line)',
              '$x^2-y^2=0$\n→ Two planes $y=\\pm x$']
    for i, title in enumerate(titles):
        ax = fig.add_subplot(1, 3, i+1, projection='3d')
        if i == 0:
            ax.plot([0],[0],[0],'ro',markersize=15,zorder=5)
        elif i == 1:
            ax.plot([0,0],[0,0],[-3,3],'b-',lw=3)
        elif i == 2:
            xx,yy = np.meshgrid(np.linspace(-2,2,10), np.linspace(-2,2,10))
            zz = np.linspace(-2,2,8)
            for z in zz:
                ax.plot(xx[0], xx[0], np.full_like(xx[0],z), 'orange', lw=1, alpha=0.5)
                ax.plot(xx[0], -xx[0], np.full_like(xx[0],z), 'green', lw=1, alpha=0.5)
        ax.set_title(title, fontweight='bold', fontsize=10)
        ax.set_xlim(-2,2); ax.set_ylim(-2,2); ax.set_zlim(-2,2)
        ax.view_init(elev=20, azim=-50)
        ax.set_xlabel('X'); ax.set_ylabel('Y'); ax.set_zlabel('Z')
    fig.suptitle('Degenerate Quadric Surfaces', fontsize=14, fontweight='bold')
    save('9c-degenerate-cases.png')

# ============================================================
# 9c-sphere-plane-intersection.png
# ============================================================
def fig_sphere_plane_intersection():
    fig = plt.figure(figsize=(10, 9))
    ax = fig.add_subplot(111, projection='3d')
    # Sphere x^2+y^2+z^2=20
    u = np.linspace(0, 2*np.pi, 40); v = np.linspace(0, np.pi, 25)
    R = np.sqrt(20)
    x = R*np.outer(np.cos(u), np.sin(v))
    y = R*np.outer(np.sin(u), np.sin(v))
    z = R*np.outer(np.ones(np.size(u)), np.cos(v))
    ax.plot_wireframe(x, y, z, color='blue', alpha=0.2, lw=0.2)
    # Plane x+y+z=6
    xx,yy = np.meshgrid(np.linspace(0,4,20), np.linspace(0,4,20))
    zz = 6 - xx - yy
    zz[(zz<0)|(zz>5)] = np.nan
    ax.plot_surface(xx, yy, zz, alpha=0.4, color='orange')
    # Intersection circle
    t = np.linspace(0, 2*np.pi, 100)
    cx, cy, cz = 2, 2, 2; r = np.sqrt(8)
    # Parametric circle in plane (simplified as 3D circle)
    u_vec = np.array([1,-1,0])/np.sqrt(2)
    v_vec = np.array([1,1,-2])/np.sqrt(6)
    circ_x = cx + r*(u_vec[0]*np.cos(t) + v_vec[0]*np.sin(t))
    circ_y = cy + r*(u_vec[1]*np.cos(t) + v_vec[1]*np.sin(t))
    circ_z = cz + r*(u_vec[2]*np.cos(t) + v_vec[2]*np.sin(t))
    ax.plot(circ_x, circ_y, circ_z, 'r-', lw=3)
    ax.plot([cx],[cy],[cz],'ro',markersize=8)
    ax.set_title('Sphere $x^2+y^2+z^2=20$ ∩ Plane $x+y+z=6$\nIntersection Circle: center (2,2,2), r=2√2', fontsize=12, fontweight='bold')
    ax.set_xlim(-1,5); ax.set_ylim(-1,5); ax.set_zlim(-1,5)
    ax.view_init(elev=20, azim=-55)
    save('9c-sphere-plane-intersection.png')

# ============================================================
# 9c-cylinders-intersection.png
# ============================================================
def fig_cylinders_intersection():
    fig = plt.figure(figsize=(10, 9))
    ax = fig.add_subplot(111, projection='3d')
    # Cylinder x^2+y^2=1 along z
    z = np.linspace(-2, 2, 30); t = np.linspace(0, 2*np.pi, 50)
    T, Z = np.meshgrid(t, z)
    X1 = np.cos(T); Y1 = np.sin(T)
    ax.plot_wireframe(X1, Y1, Z, color='blue', alpha=0.25, lw=0.2)
    # Cylinder x^2+z^2=1 along y
    y = np.linspace(-2, 2, 30)
    T2, Y2 = np.meshgrid(t, y)
    X2 = np.cos(T2); Z2 = np.sin(T2)
    ax.plot_wireframe(X2, Y2, Z2, color='orange', alpha=0.25, lw=0.2)
    # Intersection curve
    ti = np.linspace(0, 2*np.pi, 200)
    ax.plot(np.cos(ti), np.sin(ti), np.sin(ti), 'r-', lw=3)
    ax.plot(np.cos(ti), np.sin(ti), -np.sin(ti), 'r-', lw=3)
    ax.set_title('$x^2+y^2=1$ ∩ $x^2+z^2=1$\nIntersection: Two Crossing Ellipses', fontsize=12, fontweight='bold')
    ax.set_xlim(-1.5,1.5); ax.set_ylim(-1.5,1.5); ax.set_zlim(-1.5,1.5)
    ax.view_init(elev=25, azim=-50)
    save('9c-cylinders-intersection.png')

# ============================================================
# 9c-line-surface-intersection.png
# ============================================================
def fig_line_surface_intersection():
    fig = plt.figure(figsize=(10, 9))
    ax = fig.add_subplot(111, projection='3d')
    # Sphere
    u = np.linspace(0, 2*np.pi, 30); v = np.linspace(0, np.pi, 20)
    x = 5*np.outer(np.cos(u), np.sin(v))
    y = 5*np.outer(np.sin(u), np.sin(v))
    z = 5*np.outer(np.ones(np.size(u)), np.cos(v))
    ax.plot_wireframe(x, y, z, color='blue', alpha=0.2, lw=0.2)
    # Line: (t, t, 5-t)
    t_vals = np.linspace(-2, 6, 100)
    ax.plot(t_vals, t_vals, 5-t_vals, 'r-', lw=2.5)
    # Intersection points
    ax.plot([0],[0],[5],'go',markersize=10,zorder=5)
    ax.plot([10/3],[10/3],[5/3],'mo',markersize=10,zorder=5)
    ax.text(0.3,0.3,5.5,'Entry (0,0,5)\nt=0',fontsize=10,color='green')
    ax.text(10/3+0.3,10/3+0.3,5/3+0.5,'Exit (10/3,10/3,5/3)\nt=10/3',fontsize=10,color='magenta')
    ax.set_title('Line–Sphere Intersection\n$(t, t, 5-t)$ ∩ $x^2+y^2+z^2=25$', fontsize=12, fontweight='bold')
    ax.set_xlim(-3,6); ax.set_ylim(-3,6); ax.set_zlim(-2,7)
    ax.view_init(elev=20, azim=-55)
    save('9c-line-surface-intersection.png')

# ============================================================
# 9c-symmetry-3d.png
# ============================================================
def fig_symmetry_3d():
    fig = plt.figure(figsize=(14, 5))
    titles = ['$z=x^2+y^2$\nxz, yz symmetry\n+ rotational about z',
              '$x^2+y^2+z^2=1$\nAll plane symmetries\n+ origin + rotational',
              '$z=xy$\nOrigin symmetry only\n(x,y)→(−x,−y)']
    for i in range(3):
        ax = fig.add_subplot(1, 3, i+1, projection='3d')
        if i == 0:
            x=np.linspace(-2,2,20);y=np.linspace(-2,2,20)
            X,Y=np.meshgrid(x,y);Z=X**2+Y**2
            ax.plot_wireframe(X,Y,Z,color='blue',alpha=0.5,lw=0.2)
        elif i == 1:
            u=np.linspace(0,2*np.pi,20);v=np.linspace(0,np.pi,15)
            x=np.outer(np.cos(u),np.sin(v));y=np.outer(np.sin(u),np.sin(v));z=np.outer(np.ones(np.size(u)),np.cos(v))
            ax.plot_wireframe(x,y,z,color='blue',alpha=0.5,lw=0.2)
        else:
            x=np.linspace(-2,2,20);y=np.linspace(-2,2,20)
            X,Y=np.meshgrid(x,y);Z=X*Y
            ax.plot_wireframe(X,Y,Z,color='blue',alpha=0.5,lw=0.2)
        ax.set_title(titles[i], fontsize=10, fontweight='bold')
        ax.view_init(elev=20, azim=-50)
        ax.set_xlabel('X'); ax.set_ylabel('Y'); ax.set_zlabel('Z')
    fig.suptitle('Symmetry in 3D Surfaces', fontsize=14, fontweight='bold')
    save('9c-symmetry-3d.png')

# ============================================================
# 9c-step-intersection.png
# ============================================================
def fig_step_intersection():
    fig = plt.figure(figsize=(15, 5))
    titles = ['Step 1: Sphere\n$x^2+y^2+z^2=20$',
              'Step 2: Slice with plane\n$x+y+z=6$',
              'Step 3: Intersection circle\n$r=\\sqrt{R^2-D^2}=2\\sqrt{2}$']
    for i in range(3):
        ax = fig.add_subplot(1, 3, i+1, projection='3d')
        u = np.linspace(0, 2*np.pi, 25); v = np.linspace(0, np.pi, 18)
        R = np.sqrt(20)
        x = R*np.outer(np.cos(u), np.sin(v))
        y = R*np.outer(np.sin(u), np.sin(v))
        z = R*np.outer(np.ones(np.size(u)), np.cos(v))
        ax.plot_wireframe(x, y, z, color='blue', alpha=0.3, lw=0.2)
        if i >= 1:
            xx,yy = np.meshgrid(np.linspace(0,4,12), np.linspace(0,4,12))
            zz = 6-xx-yy
            zz[(zz<0)|(zz>5)] = np.nan
            ax.plot_surface(xx, yy, zz, alpha=0.4, color='orange')
        if i == 2:
            t = np.linspace(0, 2*np.pi, 100)
            u_vec = np.array([1,-1,0])/np.sqrt(2)
            v_vec = np.array([1,1,-2])/np.sqrt(6)
            r = np.sqrt(8)
            cx = 2+r*(u_vec[0]*np.cos(t)+v_vec[0]*np.sin(t))
            cy = 2+r*(u_vec[1]*np.cos(t)+v_vec[1]*np.sin(t))
            cz = 2+r*(u_vec[2]*np.cos(t)+v_vec[2]*np.sin(t))
            ax.plot(cx, cy, cz, 'r-', lw=3)
            ax.plot([2],[2],[2],'ro',markersize=6)
        ax.set_title(titles[i], fontweight='bold', fontsize=10)
        ax.set_xlim(-3,5); ax.set_ylim(-3,5); ax.set_zlim(-3,5)
        ax.view_init(elev=20, azim=-55)
    fig.suptitle('Sphere–Plane Intersection — Step by Step', fontsize=14, fontweight='bold')
    save('9c-step-intersection.png')

# ============================================================
# 9c-step-quadrics.png
# ============================================================
def fig_step_quadrics():
    fig = plt.figure(figsize=(15, 9))
    # Three quadrics, 3 stages each
    surfaces = [
        ('Ellipsoid', lambda ax, stage: plot_ellipsoid_stage(ax, stage, 'ellipsoid')),
        ('Paraboloid', lambda ax, stage: plot_ellipsoid_stage(ax, stage, 'paraboloid')),
        ('Hyperboloid 1-Sheet', lambda ax, stage: plot_ellipsoid_stage(ax, stage, 'hyper1')),
    ]
    for col, (name, plot_fn) in enumerate(surfaces):
        for row in range(3):
            ax = fig.add_subplot(3, 3, row*3+col+1, projection='3d')
            plot_fn(ax, row)
            stage_names = ['Wireframe\nSkeleton', 'Solid\nSurface', '+ Cross\nSections']
            if row == 0:
                ax.set_title(name, fontsize=10, fontweight='bold')
            if col == 0:
                ax.set_ylabel(stage_names[row], fontsize=9, fontweight='bold', labelpad=20)
            ax.view_init(elev=20, azim=-50)
            ax.set_axis_off()
    fig.suptitle('Building Quadric Surfaces — Step by Step', fontsize=14, fontweight='bold')
    save('9c-step-quadrics.png')

def plot_ellipsoid_stage(ax, stage, stype):
    if stype == 'ellipsoid':
        u=np.linspace(0,2*np.pi,20);v=np.linspace(0,np.pi,12)
        a,b,c=2,1.5,1
        x=a*np.outer(np.cos(u),np.sin(v));y=b*np.outer(np.sin(u),np.sin(v));z=c*np.outer(np.ones(np.size(u)),np.cos(v))
        if stage==0: ax.plot_wireframe(x,y,z,color='blue',alpha=0.5,lw=0.3)
        elif stage==1: ax.plot_surface(x,y,z,alpha=0.6,color='lightblue')
        else:
            ax.plot_surface(x,y,z,alpha=0.5,color='lightblue')
            t=np.linspace(0,2*np.pi,50)
            ax.plot(a*np.cos(t),b*np.sin(t),np.zeros_like(t),'r-',lw=2)
            ax.plot(np.zeros_like(t),b*np.cos(t),c*np.sin(t),'g-',lw=2)
    elif stype == 'paraboloid':
        x=np.linspace(-2,2,12);y=np.linspace(-2,2,12)
        X,Y=np.meshgrid(x,y);Z=X**2+Y**2
        if stage==0: ax.plot_wireframe(X,Y,Z,color='blue',alpha=0.5,lw=0.3)
        elif stage==1: ax.plot_surface(X,Y,Z,alpha=0.6,color='lightblue')
        else:
            ax.plot_surface(X,Y,Z,alpha=0.5,color='lightblue')
            for cz in [1,2,3]:
                t=np.linspace(0,2*np.pi,50)
                ax.plot(np.sqrt(cz)*np.cos(t),np.sqrt(cz)*np.sin(t),np.full_like(t,cz),'r-',lw=1.5)
    elif stype == 'hyper1':
        u=np.linspace(0,2*np.pi,15);v=np.linspace(-1.5,1.5,10)
        U,V=np.meshgrid(u,v)
        X=np.cosh(V)*np.cos(U);Y=np.cosh(V)*np.sin(U);Z=1.5*np.sinh(V)
        if stage==0: ax.plot_wireframe(X,Y,Z,color='blue',alpha=0.5,lw=0.3)
        elif stage==1: ax.plot_surface(X,Y,Z,alpha=0.6,color='lightblue')
        else:
            ax.plot_surface(X,Y,Z,alpha=0.5,color='lightblue')
            for z_val in [0,1.5]:
                t=np.linspace(0,2*np.pi,50)
                r=np.sqrt(1+(z_val/1.5)**2)
                ax.plot(r*np.cos(t),r*np.sin(t),np.full_like(t,z_val),'r-',lw=1.5)


# ============================================================
# Run all
# ============================================================
if __name__ == '__main__':
    print("Generating 9C graphs...")
    fig_coordinate_system_3d()
    fig_step_3d_coords()
    fig_vector_dot_cross()
    fig_step_vectors()
    fig_plane_intercept()
    fig_plane_normal()
    fig_step_plane()
    fig_point_plane_distance()
    fig_angle_planes()
    fig_distance_parallel_planes()
    fig_sphere_details()
    fig_point_sphere_distance()
    fig_surface_height_map()
    fig_step_surface_build()
    fig_domain_regions()
    fig_level_curves_method()
    fig_level_curves_to_surface()
    fig_contour_steepness()
    fig_step_level_curves()
    fig_quadric_identification()
    fig_ellipsoid_details()
    fig_paraboloid_details()
    fig_hyperbolic_paraboloid_details()
    fig_cylinder_types()
    fig_hyperboloid_one_sheet()
    fig_hyperboloid_two_sheets()
    fig_cone_details()
    fig_quadric_comparison()
    fig_degenerate_cases()
    fig_sphere_plane_intersection()
    fig_cylinders_intersection()
    fig_line_surface_intersection()
    fig_symmetry_3d()
    fig_step_intersection()
    fig_step_quadrics()
    print(f"Done! 35 graphs saved to {OUT}/")
