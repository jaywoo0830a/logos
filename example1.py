#!/usr/bin/env python3
"""Generate all graph images for Session 9B: 2D Geometry."""
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import numpy as np
import os

OUT = os.path.dirname(os.path.abspath(__file__)) + "/9B"
os.makedirs(OUT, exist_ok=True)

plt.rcParams.update({
    'figure.dpi': 150,
    'font.size': 11,
    'axes.titlesize': 13,
    'axes.labelsize': 11,
})

def save(name):
    plt.tight_layout(pad=1.5)
    plt.savefig(f"{OUT}/{name}", bbox_inches='tight', facecolor='white', edgecolor='none')
    plt.close()
    print(f"  ✓ {name}")

# ============================================================
# 9b-line-forms.png
# ============================================================
def fig_line_forms():
    fig, axes = plt.subplots(2, 3, figsize=(14, 9))
    x = np.linspace(-2, 8, 100)
    forms = [
        ("① Slope-Intercept\n$y = -\\frac{2}{3}x + 2$", lambda x: -2/3*x+2, 'm=-2/3, b=2'),
        ("② Point-Slope\n$y-0 = -\\frac{2}{3}(x-3)$", lambda x: -2/3*(x-3), 'through (3,0)'),
        ("③ Two-Point\n$\\frac{y-2}{x-0} = \\frac{0-2}{3-0}$", lambda x: -2/3*x+2, 'through (0,2),(3,0)'),
        ("④ Intercept\n$\\frac{x}{3} + \\frac{y}{2} = 1$", lambda x: -2/3*x+2, 'x-int=3, y-int=2'),
        ("⑤ General\n$2x + 3y - 6 = 0$", lambda x: -2/3*x+2, 'A=2,B=3,C=-6'),
        ("All Five Forms\nSame line: $2x+3y=6$", lambda x: -2/3*x+2, ''),
    ]
    for ax, (title, fn, note) in zip(axes.flat, forms):
        ax.plot(x, fn(x), 'b-', linewidth=2.5)
        ax.axhline(0, color='gray', linewidth=0.5)
        ax.axvline(0, color='gray', linewidth=0.5)
        ax.plot(3, 0, 'ro', markersize=6)
        ax.plot(0, 2, 'ro', markersize=6)
        ax.set_xlim(-1, 7); ax.set_ylim(-1.5, 3.5)
        ax.set_title(title, fontsize=10, fontweight='bold')
        ax.set_xlabel('x'); ax.set_ylabel('y')
        ax.grid(True, alpha=0.3)
        if note:
            ax.text(0.5, -0.25, note, transform=ax.transAxes, ha='center', fontsize=8, color='gray')
    axes.flat[-1].set_facecolor('#f5f5f5')
    axes.flat[-1].text(0.5, 0.5, '2x + 3y = 6', transform=axes.flat[-1].transAxes,
                       ha='center', va='center', fontsize=16, fontweight='bold', color='navy')
    fig.suptitle('The Five Forms of a Line', fontsize=14, fontweight='bold', y=1.01)
    save('9b-line-forms.png')

# ============================================================
# 9b-step-line-forms.png
# ============================================================
def fig_step_line_forms():
    fig, axes = plt.subplots(1, 3, figsize=(15, 5))
    x = np.linspace(-1, 7, 100)
    titles = ["Step 1: Plot (2,1) + slope 3/4", "Step 2: Draw the line", "Step 3: All five forms"]
    for i, ax in enumerate(axes):
        ax.plot(x, 3/4*x - 0.5, 'b-', linewidth=2.5)
        ax.plot(2, 1, 'ro', markersize=8, zorder=5)
        if i >= 1:
            ax.plot(6, 4, 'ro', markersize=8, zorder=5)
            ax.annotate('', xy=(6,4), xytext=(2,1),
                       arrowprops=dict(arrowstyle='->', color='green', lw=2))
        ax.axhline(0, color='gray', linewidth=0.5)
        ax.axvline(0, color='gray', linewidth=0.5)
        ax.set_xlim(-0.5, 7); ax.set_ylim(-1.5, 5)
        ax.set_title(titles[i], fontweight='bold')
        ax.set_xlabel('x'); ax.set_ylabel('y')
        ax.grid(True, alpha=0.3)
    axes[2].annotate('y=¾x−½', xy=(4, 2.5), fontsize=9, color='navy')
    axes[2].annotate('3x−4y−2=0', xy=(4, 1.5), fontsize=9, color='darkgreen')
    fig.suptitle('Building a Line — Step by Step', fontsize=14, fontweight='bold')
    save('9b-step-line-forms.png')

# ============================================================
# 9b-parallel-perpendicular.png
# ============================================================
def fig_parallel_perpendicular():
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(13, 5.5))
    x = np.linspace(-3, 3, 100)
    # Parallel
    ax1.plot(x, 2*x+1, 'b-', lw=2.5, label='y=2x+1')
    ax1.plot(x, 2*x-5, 'r--', lw=2.5, label='y=2x−5')
    ax1.set_title('Parallel: $m_1=m_2=2$', fontweight='bold')
    ax1.legend(); ax1.grid(True, alpha=0.3)
    ax1.axhline(0,color='gray',lw=0.5); ax1.axvline(0,color='gray',lw=0.5)
    ax1.set_xlim(-3,3); ax1.set_ylim(-6,6)
    # Perpendicular
    ax2.plot(x, 2/3*x, 'b-', lw=2.5, label='y=(2/3)x')
    ax2.plot(x, -3/2*x, 'r--', lw=2.5, label='y=−(3/2)x')
    ax2.set_title('Perpendicular: $m_1 m_2 = -1$', fontweight='bold')
    ax2.legend(); ax2.grid(True, alpha=0.3)
    ax2.axhline(0,color='gray',lw=0.5); ax2.axvline(0,color='gray',lw=0.5)
    ax2.set_xlim(-3,3); ax2.set_ylim(-3,3)
    ax2.annotate('90°', xy=(0.5,0.33), fontsize=14, color='purple')
    fig.suptitle('Parallel and Perpendicular Lines', fontsize=14, fontweight='bold')
    save('9b-parallel-perpendicular.png')

# ============================================================
# 9b-angle-between-lines.png
# ============================================================
def fig_angle_between_lines():
    fig, ax = plt.subplots(figsize=(9, 7))
    x = np.linspace(-2, 3, 100)
    ax.plot(x, 2*x, 'b-', lw=2.5, label='$y=2x$ ($m_1=2$)')
    ax.plot(x, -1/3*x, 'r-', lw=2.5, label='$y=-\\frac{1}{3}x$ ($m_2=-1/3$)')
    ax.axhline(0, color='gray', lw=0.5); ax.axvline(0, color='gray', lw=0.5)
    # Draw angle arc
    from matplotlib.patches import Arc
    arc = Arc((0,0), 0.8, 0.8, angle=0, theta1=np.arctan(-1/3)*180/np.pi, theta2=np.arctan(2)*180/np.pi, color='purple', lw=2)
    ax.add_patch(arc)
    ax.text(0.45, 0.2, '$\\phi \\approx 81.9°$', fontsize=13, color='purple', fontweight='bold')
    ax.set_xlim(-2, 3); ax.set_ylim(-1, 6)
    ax.legend(fontsize=11); ax.grid(True, alpha=0.3)
    ax.set_title('Angle Between Two Lines\n$\\tan\\phi = |\\frac{m_2-m_1}{1+m_1 m_2}| = 7$', fontweight='bold', fontsize=13)
    ax.set_xlabel('x'); ax.set_ylabel('y')
    save('9b-angle-between-lines.png')

# ============================================================
# 9b-midpoint-division.png
# ============================================================
def fig_midpoint_division():
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(13, 5.5))
    # Midpoint
    ax1.plot([2,8],[5,-1], 'b-o', lw=2, markersize=8)
    ax1.plot(5, 2, 'rs', markersize=12, zorder=5)
    ax1.annotate('(2,5)', (2,5), textcoords="offset points", xytext=(-15,10))
    ax1.annotate('(8,−1)', (8,-1), textcoords="offset points", xytext=(5,-15))
    ax1.annotate('M(5,2)', (5,2), textcoords="offset points", xytext=(10,10), color='red', fontweight='bold')
    ax1.set_title('Midpoint', fontweight='bold')
    ax1.grid(True, alpha=0.3); ax1.set_xlim(0,10); ax1.set_ylim(-3,7)
    # Section formula + triangle centroid
    ax2.plot([1,7],[2,8], 'b-o', lw=2, markersize=8)
    ax2.plot(5, 6, 'rs', markersize=12, zorder=5)
    ax2.annotate('(1,2)', (1,2), textcoords="offset points", xytext=(-15,5))
    ax2.annotate('(7,8)', (7,8), textcoords="offset points", xytext=(5,5))
    ax2.annotate('2:1 point\n(5,6)', (5,6), textcoords="offset points", xytext=(10,-15), color='red', fontweight='bold')
    # Triangle
    tri = np.array([[0,0],[8,0],[3,5],[0,0]])
    ax2.plot(tri[:,0], tri[:,1], 'g-', lw=1.5, alpha=0.6)
    ax2.fill(tri[:,0], tri[:,1], 'green', alpha=0.08)
    ax2.plot(11/3, 5/3, 'g*', markersize=15)
    ax2.annotate('Centroid\n(11/3, 5/3)', (11/3,5/3), textcoords="offset points", xytext=(10,-15), color='green')
    ax2.set_title('Section Formula & Centroid', fontweight='bold')
    ax2.grid(True, alpha=0.3); ax2.set_xlim(-1,10); ax2.set_ylim(-1,9)
    fig.suptitle('Midpoint and Section Formula', fontsize=14, fontweight='bold')
    save('9b-midpoint-division.png')

# ============================================================
# 9b-point-line-distance-derivation.png
# ============================================================
def fig_point_line_distance_derivation():
    fig, axes = plt.subplots(1, 3, figsize=(15, 5))
    x = np.linspace(-2, 5, 100)
    titles = ['Step 1: Perpendicular\nshortest path', 'Step 2: Normal vector\nn=(3,4)', 'Step 3: Distance = 3\n|9+16-10|/5']
    for i, ax in enumerate(axes):
        ax.plot(x, (10-3*x)/4, 'b-', lw=2.5)
        ax.plot(3, 4, 'ro', markersize=8, zorder=5)
        ax.quiver(3, 4, -0.9, -1.2, angles='xy', scale_units='xy', scale=1, color='red', width=0.008)
        if i >= 1:
            mid_x, mid_y = 1.5, 2
            ax.quiver(mid_x, mid_y, 3, 4, angles='xy', scale_units='xy', scale=1, color='green', width=0.01)
            ax.annotate('n=(3,4)', (mid_x+3, mid_y+4), fontsize=9, color='green')
        if i == 2:
            ax.plot([3, 1.2], [4, 1.6], 'r--', lw=1.5)
            ax.annotate('d=3', (2, 3), fontsize=12, color='red', fontweight='bold')
        ax.set_title(titles[i], fontweight='bold', fontsize=10)
        ax.axhline(0,color='gray',lw=0.5); ax.axvline(0,color='gray',lw=0.5)
        ax.set_xlim(-1,5); ax.set_ylim(-0.5,5.5)
        ax.set_xlabel('x'); ax.set_ylabel('y')
        ax.grid(True, alpha=0.3)
    fig.suptitle('Deriving Point-to-Line Distance', fontsize=14, fontweight='bold')
    save('9b-point-line-distance-derivation.png')

# ============================================================
# 9b-step-distance-line.png
# ============================================================
def fig_step_distance_line():
    fig, axes = plt.subplots(1, 3, figsize=(15, 5))
    x = np.linspace(-2, 6, 100)
    for i, ax in enumerate(axes):
        ax.plot(x, (10-3*x)/4, 'b-', lw=2.5, label='3x+4y=10')
        ax.plot(3, 4, 'ro', markersize=8, zorder=5)
        ax.set_title(['Step 1: Point & Line', 'Step 2: Perpendicular', 'Step 3: d=15/5=3'][i], fontweight='bold')
        ax.axhline(0,color='gray',lw=0.5); ax.axvline(0,color='gray',lw=0.5)
        ax.set_xlim(-1,5); ax.set_ylim(-0.5,5.5)
        ax.grid(True, alpha=0.3)
    axes[1].plot([3, 1.2], [4, 1.6], 'r--', lw=2)
    axes[2].plot([3, 1.2], [4, 1.6], 'r--', lw=2)
    axes[2].annotate('d = 3', xy=(2.1, 3), fontsize=14, color='red', fontweight='bold')
    axes[2].annotate('foot (1.2, 1.6)', xy=(0.4, 1.2), fontsize=9, color='darkgreen')
    axes[2].plot(1.2, 1.6, 'go', markersize=7)
    fig.suptitle('Point to Line Distance — Step by Step', fontsize=14, fontweight='bold')
    save('9b-step-distance-line.png')

# ============================================================
# 9b-two-lines-distance.png
# ============================================================
def fig_two_lines_distance():
    fig, ax = plt.subplots(figsize=(9, 7))
    x = np.linspace(-8, 6, 100)
    ax.plot(x, (5-3*x)/4, 'b-', lw=2.5, label='3x+4y−5=0')
    ax.plot(x, (-15-3*x)/4, 'r-', lw=2.5, label='3x+4y+15=0')
    # Perpendicular segment
    ax.annotate('', xy=(0.5, -4.125), xytext=(0.5, 0.875),
                arrowprops=dict(arrowstyle='<->', color='red', lw=2.5))
    ax.text(1.2, -1.8, 'd = |15−(−5)|/5\n    = 4', fontsize=13, color='red', fontweight='bold')
    ax.axhline(0,color='gray',lw=0.5); ax.axvline(0,color='gray',lw=0.5)
    ax.legend(fontsize=12); ax.grid(True, alpha=0.3)
    ax.set_xlim(-6,4); ax.set_ylim(-6,4)
    ax.set_title('Distance Between Parallel Lines', fontsize=14, fontweight='bold')
    ax.set_xlabel('x'); ax.set_ylabel('y')
    save('9b-two-lines-distance.png')

# ============================================================
# 9b-point-circle-distance.png
# ============================================================
def fig_point_circle_distance():
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(13, 5.5))
    # Outside
    circle1 = plt.Circle((0,0), 3, fill=False, color='blue', lw=2.5)
    ax1.add_patch(circle1)
    ax1.plot(5, 0, 'ro', markersize=8)
    ax1.plot([5,3], [0,0], 'r--', lw=2)
    ax1.plot(3, 0, 'go', markersize=8)
    ax1.text(5.2, 0.3, 'P(5,0)', fontsize=11)
    ax1.text(4, -0.5, 'd=5−3=2', fontsize=12, color='red', fontweight='bold')
    ax1.set_title('Point Outside: d = |PC| − R', fontweight='bold')
    ax1.set_xlim(-1,7); ax1.set_ylim(-4,4); ax1.set_aspect('equal')
    ax1.grid(True, alpha=0.3); ax1.axhline(0,color='gray',lw=0.5); ax1.axvline(0,color='gray',lw=0.5)
    # Inside
    circle2 = plt.Circle((0,0), 3, fill=False, color='blue', lw=2.5)
    ax2.add_patch(circle2)
    ax2.plot(1, 0, 'ro', markersize=8)
    ax2.plot([1,3], [0,0], 'r--', lw=2)
    ax2.plot(3, 0, 'go', markersize=8)
    ax2.text(1.2, 0.3, 'P(1,0)', fontsize=11)
    ax2.text(2, -0.5, 'd=3−1=2', fontsize=12, color='red', fontweight='bold')
    ax2.set_title('Point Inside: d = R − |PC|', fontweight='bold')
    ax2.set_xlim(-4,7); ax2.set_ylim(-4,4); ax2.set_aspect('equal')
    ax2.grid(True, alpha=0.3); ax2.axhline(0,color='gray',lw=0.5); ax2.axvline(0,color='gray',lw=0.5)
    fig.suptitle('Point-to-Circle Distance', fontsize=14, fontweight='bold')
    save('9b-point-circle-distance.png')

# ============================================================
# 9b-tangent-lines-circle.png
# ============================================================
def fig_tangent_lines_circle():
    fig, ax = plt.subplots(figsize=(9, 8))
    circle = plt.Circle((0,0), 2, fill=False, color='blue', lw=2.5)
    ax.add_patch(circle)
    ax.plot(5, 0, 'ro', markersize=10, zorder=5)
    ax.text(5.3, 0.3, 'P(5,0)', fontsize=12)
    # Tangent points
    tx = 4/5
    ty = 2*np.sqrt(21)/5
    ax.plot(tx, ty, 'go', markersize=8)
    ax.plot(tx, -ty, 'go', markersize=8)
    ax.plot([5, tx], [0, ty], 'r-', lw=2)
    ax.plot([5, tx], [0, -ty], 'r-', lw=2)
    # Right angle markers (small squares)
    ax.plot([0.3, 0.3+0.15], [0.5, 0.5-0.15], 'purple', lw=1.2)
    ax.text(1.5, 1.5, '$PT=\\sqrt{21}$', fontsize=11, color='red')
    ax.text(2.8, 0.8, 'tangent lines', fontsize=10, color='red', rotation=25)
    ax.text(2.8, -1.2, 'tangent lines', fontsize=10, color='red', rotation=-25)
    ax.set_title('Tangent Lines from External Point to Circle\n$x^2+y^2=4$, P(5,0)', fontweight='bold', fontsize=13)
    ax.set_xlim(-3,7); ax.set_ylim(-5,5); ax.set_aspect('equal')
    ax.grid(True, alpha=0.3)
    ax.axhline(0,color='gray',lw=0.5); ax.axvline(0,color='gray',lw=0.5)
    save('9b-tangent-lines-circle.png')

# ============================================================
# 9b-circle-details.png
# ============================================================
def fig_circle_details():
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(13, 5.5))
    # Left: features
    theta = np.linspace(0, 2*np.pi, 200)
    ax1.plot(3+4*np.cos(theta), -2+4*np.sin(theta), 'b-', lw=2.5)
    ax1.plot(3, -2, 'ro', markersize=10, zorder=5)
    ax1.annotate('C(3,−2)', (3,-2), textcoords="offset points", xytext=(10,10), fontsize=11, fontweight='bold', color='red')
    ax1.annotate('R=4', (5.5, 1), fontsize=12, color='blue', fontweight='bold')
    # diameter
    ax1.plot([3,7], [-2,-2], 'g--', lw=1.5)
    ax1.plot([3,-1], [-2,-2], 'g--', lw=1.5)
    ax1.set_title('$(x-3)^2+(y+2)^2=16$\nCenter (3,−2), Radius 4', fontweight='bold')
    ax1.set_aspect('equal'); ax1.grid(True, alpha=0.3)
    ax1.axhline(0,color='gray',lw=0.5); ax1.axvline(0,color='gray',lw=0.5)
    ax1.set_xlim(-3,9); ax1.set_ylim(-8,4)
    # Right: completing square
    ax2.axis('off')
    text = (
        "General Form:\n"
        "$x^2+y^2-6x+4y-3=0$\n\n"
        "Step 1: Group\n"
        "$(x^2-6x)+(y^2+4y)=3$\n\n"
        "Step 2: Complete squares\n"
        "$(x^2-6x+9)+(y^2+4y+4)=3+9+4$\n\n"
        "Step 3: Standard form\n"
        "$(x-3)^2+(y+2)^2=16$"
    )
    ax2.text(0.1, 0.5, text, transform=ax2.transAxes, fontsize=14, va='center', family='monospace',
             bbox=dict(boxstyle='round', facecolor='#f0f0f0', alpha=0.8))
    fig.suptitle('Circle — Standard Form and General Form', fontsize=14, fontweight='bold')
    save('9b-circle-details.png')

# ============================================================
# 9b-step-conic-circle.png
# ============================================================
def fig_step_conic_circle():
    fig, axes = plt.subplots(1, 3, figsize=(15, 5))
    theta = np.linspace(0, 2*np.pi, 200)
    titles = ["Step 1: Center (h,k)", "Step 2: Points at distance R", "Step 3: Circle + Features"]
    for i, ax in enumerate(axes):
        ax.plot(3, -2, 'ro', markersize=10, zorder=5)
        ax.annotate('C(3,−2)', (3,-2), textcoords="offset points", xytext=(5,5), fontsize=10, fontweight='bold')
        if i >= 1:
            ax.plot(3+4*np.cos(theta), -2+4*np.sin(theta), 'b-', lw=2.5)
            # sample points
            for ang in [0, np.pi/3, 2*np.pi/3, np.pi, 4*np.pi/3, 5*np.pi/3]:
                ax.plot(3+4*np.cos(ang), -2+4*np.sin(ang), 'b.', markersize=6)
        if i == 2:
            ax.annotate('R=4', (5.5, 1), fontsize=12, color='blue', fontweight='bold')
            ax.arrow(3, -2, 4, 0, head_width=0.3, head_length=0.3, fc='blue', ec='blue')
        ax.set_title(titles[i], fontweight='bold')
        ax.set_xlim(-3,9); ax.set_ylim(-8,4); ax.set_aspect('equal')
        ax.grid(True, alpha=0.3)
        ax.axhline(0,color='gray',lw=0.5); ax.axvline(0,color='gray',lw=0.5)
    fig.suptitle('Building a Circle — Step by Step', fontsize=14, fontweight='bold')
    save('9b-step-conic-circle.png')

# ============================================================
# 9b-ellipse-details.png
# ============================================================
def fig_ellipse_details():
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 6))
    theta = np.linspace(0, 2*np.pi, 300)
    a, b, c = 5, 3, 4
    # Left: features
    ax1.plot(a*np.cos(theta), b*np.sin(theta), 'b-', lw=2.5)
    ax1.plot(0,0,'ko',markersize=6); ax1.annotate('Center',(0,0),textcoords="offset points",xytext=(5,-15),fontsize=9)
    ax1.plot([a,-a],[0,0],'ro',markersize=7); ax1.plot([0,0],[b,-b],'gs',markersize=7)
    ax1.plot([c,-c],[0,0],'m*',markersize=12)
    ax1.annotate('F₁(−4,0)',(-c,0),textcoords="offset points",xytext=(-10,-20),fontsize=9,color='magenta')
    ax1.annotate('F₂(4,0)',(c,0),textcoords="offset points",xytext=(5,-20),fontsize=9,color='magenta')
    ax1.annotate('V(5,0)',(a,0),textcoords="offset points",xytext=(5,5),fontsize=9,color='red')
    ax1.annotate('V(−5,0)',(-a,0),textcoords="offset points",xytext=(-30,5),fontsize=9,color='red')
    ax1.set_title('$x^2/25 + y^2/9 = 1$\na=5, b=3, c=4, e=0.8', fontweight='bold')
    ax1.set_aspect('equal'); ax1.grid(True, alpha=0.3)
    ax1.axhline(0,color='gray',lw=0.5); ax1.axvline(0,color='gray',lw=0.5)
    # Right: sum property
    ax2.plot(a*np.cos(theta), b*np.sin(theta), 'b-', lw=2.5)
    ax2.plot([c,-c],[0,0],'m*',markersize=12)
    px, py = 2, 2.75  # a point on ellipse
    ax2.plot(px, py, 'ro', markersize=8)
    ax2.plot([px,c],[py,0],'r--',lw=1); ax2.plot([px,-c],[py,0],'r--',lw=1)
    ax2.annotate('P',(px,py),textcoords="offset points",xytext=(5,10),fontsize=11)
    d1 = np.sqrt((px-c)**2+py**2); d2 = np.sqrt((px+c)**2+py**2)
    ax2.text(0.5, -4.5, f'PF₁+PF₂ = {d1+d2:.1f} ≈ 2a = 10', fontsize=12, ha='center', fontweight='bold', color='red',
             bbox=dict(boxstyle='round',facecolor='wheat',alpha=0.8))
    ax2.set_title('Geometric Definition:\nPF₁ + PF₂ = 2a (constant)', fontweight='bold')
    ax2.set_aspect('equal'); ax2.grid(True, alpha=0.3)
    ax2.axhline(0,color='gray',lw=0.5); ax2.axvline(0,color='gray',lw=0.5)
    fig.suptitle('Ellipse — Features and Geometric Definition', fontsize=14, fontweight='bold')
    save('9b-ellipse-details.png')

# ============================================================
# 9b-step-conic-ellipse.png
# ============================================================
def fig_step_conic_ellipse():
    fig, axes = plt.subplots(1, 3, figsize=(15, 5))
    theta = np.linspace(0, 2*np.pi, 300)
    a, b, c = 5, 3, 4
    titles = ["Step 1: Vertices (±a,0)\nCo-vertices (0,±b)", "Step 2: Foci (±c,0)\n$c^2=a^2-b^2$", "Step 3: Trace ellipse\n$PF_1+PF_2=2a$"]
    for i, ax in enumerate(axes):
        ax.plot([a,-a],[0,0],'ro',markersize=7); ax.plot([0,0],[b,-b],'gs',markersize=7)
        if i >= 1:
            ax.plot([c,-c],[0,0],'m*',markersize=12)
        if i == 2:
            ax.plot(a*np.cos(theta), b*np.sin(theta), 'b-', lw=2.5)
        ax.set_title(titles[i], fontweight='bold', fontsize=10)
        ax.set_xlim(-7,7); ax.set_ylim(-5,5); ax.set_aspect('equal')
        ax.grid(True, alpha=0.3)
        ax.axhline(0,color='gray',lw=0.5); ax.axvline(0,color='gray',lw=0.5)
    fig.suptitle('Building an Ellipse — Step by Step', fontsize=14, fontweight='bold')
    save('9b-step-conic-ellipse.png')

# ============================================================
# 9b-parabola-details.png
# ============================================================
def fig_parabola_details():
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 6))
    h, k, p = 2, 1, 0.5
    # Left: features
    x = np.linspace(-1, 5, 200)
    y = 0.5*(x-h)**2 + k
    ax1.plot(x, y, 'b-', lw=2.5)
    ax1.plot(h, k, 'ro', markersize=8)
    ax1.plot(h, k+p, 'm*', markersize=14)
    ax1.axhline(y=k-p, color='green', linestyle='--', lw=2)
    ax1.annotate('Vertex (2,1)', (h,k), textcoords="offset points", xytext=(15,10), fontsize=10, color='red')
    ax1.annotate('Focus (2, 1.5)', (h,k+p), textcoords="offset points", xytext=(15,5), fontsize=10, color='magenta')
    ax1.annotate('Directrix y=0.5', (3.5, k-p+0.05), fontsize=10, color='green')
    ax1.annotate('p=½', (h+0.2, k+0.25), fontsize=11)
    ax1.set_title('$y = \\frac{1}{2}(x-2)^2+1$\nVertex(2,1), Focus(2,1.5), p=½', fontweight='bold')
    ax1.grid(True, alpha=0.3); ax1.set_xlim(-0.5,5); ax1.set_ylim(-0.5,5)
    # Right: equidistance
    x2 = np.linspace(-2, 4, 200)
    y2 = 0.25*x2**2
    ax2.plot(x2, y2, 'b-', lw=2.5)
    ax2.plot(0, 1, 'm*', markersize=14)  # focus
    ax2.axhline(y=-1, color='green', linestyle='--', lw=2)
    # Pick point
    px = 2; py = 1
    ax2.plot(px, py, 'ro', markersize=8)
    ax2.plot([px, px], [py, -1], 'r--', lw=1.5)
    ax2.plot([px, 0], [py, 1], 'r--', lw=1.5)
    ax2.text(1, 2.5, 'PF = distance\nto directrix', fontsize=10, color='red', fontweight='bold')
    ax2.set_title('Geometric Definition:\nPF = distance to directrix', fontweight='bold')
    ax2.grid(True, alpha=0.3); ax2.set_xlim(-3,4); ax2.set_ylim(-2,4.5)
    fig.suptitle('Parabola — Focus, Directrix, and Definition', fontsize=14, fontweight='bold')
    save('9b-parabola-details.png')

# ============================================================
# 9b-step-conic-parabola.png
# ============================================================
def fig_step_conic_parabola():
    fig, axes = plt.subplots(1, 3, figsize=(15, 5))
    h, k, p = 2, 1, 0.5
    titles = ["Step 1: Vertex + Directrix", "Step 2: Mark Focus at |p|", "Step 3: Trace Parabola"]
    for i, ax in enumerate(axes):
        ax.plot(h, k, 'ro', markersize=8)
        ax.axhline(y=k-p, color='green', linestyle='--', lw=2)
        if i >= 1:
            ax.plot(h, k+p, 'm*', markersize=14)
        if i == 2:
            x = np.linspace(-1, 5, 200)
            ax.plot(x, 0.5*(x-h)**2+k, 'b-', lw=2.5)
        ax.set_title(titles[i], fontweight='bold', fontsize=10)
        ax.set_xlim(-0.5, 5); ax.set_ylim(-0.5, 5)
        ax.grid(True, alpha=0.3)
    fig.suptitle('Building a Parabola — Step by Step', fontsize=14, fontweight='bold')
    save('9b-step-conic-parabola.png')

# ============================================================
# 9b-hyperbola-details.png
# ============================================================
def fig_hyperbola_details():
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 6))
    a, b = 3, 2
    c = np.sqrt(a**2+b**2)
    # Left branch x >= a
    xr = np.linspace(a, 8, 200)
    yr = b*np.sqrt((xr/a)**2 - 1)
    xl = np.linspace(-8, -a, 200)
    yl = b*np.sqrt((xl/a)**2 - 1)
    for ax in [ax1, ax2]:
        ax.plot(xr, yr, 'b-', lw=2.5); ax.plot(xr, -yr, 'b-', lw=2.5)
        ax.plot(xl, yl, 'b-', lw=2.5); ax.plot(xl, -yl, 'b-', lw=2.5)
    # Asymptotes
    xa = np.linspace(-8, 8, 100)
    ax1.plot(xa, b/a*xa, 'orange', linestyle='--', lw=1.5)
    ax1.plot(xa, -b/a*xa, 'orange', linestyle='--', lw=1.5)
    ax1.plot([a,-a],[0,0],'ro',markersize=7)
    ax1.plot([c,-c],[0,0],'m*',markersize=12)
    ax1.annotate('V(3,0)',(a,0),textcoords="offset points",xytext=(5,-15),fontsize=9,color='red')
    ax1.annotate('F(√13,0)',(c,0),textcoords="offset points",xytext=(5,10),fontsize=9,color='magenta')
    ax1.annotate('$y=\\pm\\frac{2}{3}x$',(5,3.5),fontsize=10,color='orange')
    ax1.set_title('$x^2/9 - y^2/4 = 1$\na=3, b=2, c=√13', fontweight='bold')
    ax1.set_aspect('equal'); ax1.grid(True, alpha=0.3)
    ax1.axhline(0,color='gray',lw=0.5); ax1.axvline(0,color='gray',lw=0.5); ax1.set_xlim(-8,8); ax1.set_ylim(-6,6)
    # Right: difference property
    ax2.plot([c,-c],[0,0],'m*',markersize=12)
    px = 4; py_pos = b*np.sqrt((px/a)**2-1)
    ax2.plot(px, py_pos, 'ro', markersize=8)
    ax2.plot([px,c],[py_pos,0],'r--',lw=1); ax2.plot([px,-c],[py_pos,0],'r--',lw=1)
    d1 = np.sqrt((px-c)**2+py_pos**2); d2 = np.sqrt((px+c)**2+py_pos**2)
    ax2.text(0, -5, f'|PF₁−PF₂| = |{d1:.1f}−{d2:.1f}| = {abs(d1-d2):.1f} ≈ 2a = 6',
             fontsize=11, ha='center', fontweight='bold', color='red',
             bbox=dict(boxstyle='round',facecolor='wheat',alpha=0.8))
    ax2.set_title('Geometric Definition:\n|PF₁ − PF₂| = 2a', fontweight='bold')
    ax2.set_aspect('equal'); ax2.grid(True, alpha=0.3)
    ax2.axhline(0,color='gray',lw=0.5); ax2.axvline(0,color='gray',lw=0.5); ax2.set_xlim(-8,8); ax2.set_ylim(-6,6)
    fig.suptitle('Hyperbola — Features and Geometric Definition', fontsize=14, fontweight='bold')
    save('9b-hyperbola-details.png')

# ============================================================
# 9b-step-conic-hyperbola.png
# ============================================================
def fig_step_conic_hyperbola():
    fig, axes = plt.subplots(1, 3, figsize=(15, 5))
    a, b = 3, 2; c = np.sqrt(a**2+b**2)
    titles = ["Step 1: Rectangle (±a,±b)\n+ Asymptotes (diagonals)",
              "Step 2: Vertices (±a,0)\nFoci (±c,0)",
              "Step 3: Trace Hyperbola\nBranches hug asymptotes"]
    for i, ax in enumerate(axes):
        xa = np.linspace(-7, 7, 100)
        ax.plot(xa, b/a*xa, 'orange', linestyle='--', lw=1.5)
        ax.plot(xa, -b/a*xa, 'orange', linestyle='--', lw=1.5)
        if i == 0:
            rect = plt.Rectangle((-a,-b), 2*a, 2*b, fill=False, edgecolor='gray', linestyle=':', lw=1)
            ax.add_patch(rect)
        if i >= 1:
            ax.plot([a,-a],[0,0],'ro',markersize=7)
            ax.plot([c,-c],[0,0],'m*',markersize=12)
        if i == 2:
            xr = np.linspace(a, 7, 200)
            ax.plot(xr, b*np.sqrt((xr/a)**2-1), 'b-', lw=2.5)
            ax.plot(xr, -b*np.sqrt((xr/a)**2-1), 'b-', lw=2.5)
            xl = np.linspace(-7, -a, 200)
            ax.plot(xl, b*np.sqrt((xl/a)**2-1), 'b-', lw=2.5)
            ax.plot(xl, -b*np.sqrt((xl/a)**2-1), 'b-', lw=2.5)
        ax.set_title(titles[i], fontweight='bold', fontsize=10)
        ax.set_xlim(-7,7); ax.set_ylim(-5,5); ax.set_aspect('equal')
        ax.grid(True, alpha=0.3)
        ax.axhline(0,color='gray',lw=0.5); ax.axvline(0,color='gray',lw=0.5)
    fig.suptitle('Building a Hyperbola — Step by Step', fontsize=14, fontweight='bold')
    save('9b-step-conic-hyperbola.png')

# ============================================================
# 9b-conic-identification.png
# ============================================================
def fig_conic_identification():
    fig, ax = plt.subplots(figsize=(11, 8))
    ax.axis('off')
    ax.set_xlim(0,10); ax.set_ylim(0,10)

    # Flowchart boxes
    boxes = [
        (5, 9.2, '$Ax^2+Bxy+Cy^2+Dx+Ey+F=0$', '#e8e8e8'),
        (5, 8.2, '$\\Delta = B^2 - 4AC$', '#d4e6f1'),
        (2, 6.8, '$\\Delta < 0$\nEllipse', '#d5f5e3'),
        (8, 6.8, '$\\Delta > 0$\nHyperbola', '#fadbd8'),
        (5, 6.8, '$\\Delta = 0$\nParabola', '#fdebd0'),
        (1, 5.3, 'A=C, B=0?\n→ Circle', '#d5f5e3'),
        (3.5, 5.3, 'A≠C?\n→ Ellipse', '#d5f5e3'),
        (7.5, 5.3, 'Degenerate?\n→ Lines/Point', '#fadbd8'),
    ]
    for x, y, text, color in boxes:
        bbox = dict(boxstyle='round', facecolor=color, edgecolor='gray', alpha=0.9)
        ax.text(x, y, text, ha='center', va='center', fontsize=11, bbox=bbox, transform=ax.transData)

    # Arrows (simplified as annotations)
    arrows = [(5,9.0, 5,8.4), (5,8.0, 2,7.0), (5,8.0, 5,7.0), (5,8.0, 8,7.0)]
    for x1,y1,x2,y2 in arrows:
        ax.annotate('', xy=(x2,y2), xytext=(x1,y1),
                    arrowprops=dict(arrowstyle='->', color='gray', lw=1.5))

    ax.text(5, 3.5, 'Complete the square to find center/vertex.\nDegenerate: $x^2+y^2=-1$ (empty), $x^2-y^2=0$ (two lines).',
            ha='center', fontsize=10, style='italic', color='gray')
    ax.set_title('Conic Identification — The Discriminant Method', fontsize=14, fontweight='bold', y=0.98)
    save('9b-conic-identification.png')

# ============================================================
# 9b-conic-comparison.png
# ============================================================
def fig_conic_comparison():
    fig, axes = plt.subplots(2, 2, figsize=(13, 11))
    theta = np.linspace(0, 2*np.pi, 300)
    # Circle
    ax = axes[0,0]
    ax.plot(4*np.cos(theta), 4*np.sin(theta), 'b-', lw=2.5)
    ax.plot(0,0,'ro',markersize=8); ax.text(0.5,0.5,'R=4',fontsize=11,color='red')
    ax.set_title('Circle\n$x^2+y^2=R^2$\nConstant distance from center', fontweight='bold')
    ax.set_aspect('equal'); ax.grid(True,alpha=0.3); ax.set_xlim(-5,5); ax.set_ylim(-5,5)
    # Ellipse
    ax = axes[0,1]
    ax.plot(5*np.cos(theta), 3*np.sin(theta), 'b-', lw=2.5)
    ax.plot([4,-4],[0,0],'m*',markersize=10)
    ax.text(0,3.5,'PF₁+PF₂=2a',ha='center',fontsize=10,color='magenta')
    ax.set_title('Ellipse\n$x^2/a^2+y^2/b^2=1$\nSum to foci = constant', fontweight='bold')
    ax.set_aspect('equal'); ax.grid(True,alpha=0.3); ax.set_xlim(-6,6); ax.set_ylim(-4,4)
    # Parabola
    ax = axes[1,0]
    x = np.linspace(-4,4,200)
    ax.plot(x, 0.25*x**2, 'b-', lw=2.5)
    ax.plot(0,1,'m*',markersize=12)
    ax.axhline(y=-1,color='green',linestyle='--',lw=1.5)
    ax.text(2,2.5,'PF = distance\nto directrix',fontsize=10,color='red')
    ax.set_title('Parabola\n$y=x^2/(4p)$\nEquidistant from focus & directrix', fontweight='bold')
    ax.set_aspect('equal'); ax.grid(True,alpha=0.3); ax.set_xlim(-4,4); ax.set_ylim(-2,5)
    # Hyperbola
    ax = axes[1,1]
    a2,b2=3,2; c2=np.sqrt(13)
    xr=np.linspace(3,7,200); yr=2*np.sqrt((xr/3)**2-1)
    ax.plot(xr,yr,'b-',lw=2.5); ax.plot(xr,-yr,'b-',lw=2.5)
    xl=np.linspace(-7,-3,200); yl=2*np.sqrt((xl/3)**2-1)
    ax.plot(xl,yl,'b-',lw=2.5); ax.plot(xl,-yl,'b-',lw=2.5)
    xa=np.linspace(-7,7,100); ax.plot(xa,2/3*xa,'orange',ls='--',lw=1)
    ax.plot(xa,-2/3*xa,'orange',ls='--',lw=1)
    ax.plot([c2,-c2],[0,0],'m*',markersize=10)
    ax.text(4,4,'|PF₁−PF₂|=2a',fontsize=9,color='magenta')
    ax.set_title('Hyperbola\n$x^2/a^2-y^2/b^2=1$\nDifference to foci = constant', fontweight='bold')
    ax.set_aspect('equal'); ax.grid(True,alpha=0.3); ax.set_xlim(-7,7); ax.set_ylim(-5,5)
    fig.suptitle('Four Conic Sections — Side by Side', fontsize=15, fontweight='bold')
    save('9b-conic-comparison.png')

# ============================================================
# 9b-parametric-motion.png
# ============================================================
def fig_parametric_motion():
    fig, axes = plt.subplots(2, 2, figsize=(13, 11))
    # Line segment
    ax = axes[0,0]
    t = np.linspace(0, 1, 50)
    ax.plot(1+5*t, 2+3*t, 'b-', lw=2.5)
    ax.plot(1,2,'ro',markersize=8); ax.plot(6,5,'go',markersize=8)
    for ti in [0.2,0.4,0.6,0.8]:
        ax.plot(1+5*ti,2+3*ti,'b.',markersize=5)
    ax.annotate('t=0',(1,2),textcoords="offset points",xytext=(-15,-15))
    ax.annotate('t=1',(6,5),textcoords="offset points",xytext=(5,5))
    ax.set_title('Line Segment\n$(1+5t, 2+3t), t\\in[0,1]$', fontweight='bold')
    ax.set_aspect('equal'); ax.grid(True,alpha=0.3); ax.set_xlim(0,8); ax.set_ylim(1,6)
    # Circle
    ax = axes[0,1]
    t = np.linspace(0, 2*np.pi, 200)
    ax.plot(3*np.cos(t), 3*np.sin(t), 'b-', lw=2.5)
    for ang in [0, np.pi/4, np.pi/2, 3*np.pi/4, np.pi, 5*np.pi/4]:
        ax.plot(3*np.cos(ang), 3*np.sin(ang), 'b.', markersize=5)
    ax.arrow(3,0, 0, 0.8, head_width=0.2, head_length=0.2, fc='red', ec='red')
    ax.set_title('Circle\n$(3\\cos t, 3\\sin t)$\nCounterclockwise', fontweight='bold')
    ax.set_aspect('equal'); ax.grid(True,alpha=0.3); ax.set_xlim(-4,4); ax.set_ylim(-4,4)
    # Ellipse
    ax = axes[1,0]
    ax.plot(4*np.cos(t), 2*np.sin(t), 'b-', lw=2.5)
    for ang in [0, np.pi/4, np.pi/2, 3*np.pi/4, np.pi]:
        ax.plot(4*np.cos(ang), 2*np.sin(ang), 'b.', markersize=5)
    ax.arrow(4,0, 0, 0.6, head_width=0.15, head_length=0.15, fc='red', ec='red')
    ax.set_title('Ellipse\n$(4\\cos t, 2\\sin t)$', fontweight='bold')
    ax.set_aspect('equal'); ax.grid(True,alpha=0.3); ax.set_xlim(-5,5); ax.set_ylim(-3,3)
    # Cycloid
    ax = axes[1,1]
    R = 1
    t = np.linspace(0, 4*np.pi, 400)
    ax.plot(R*(t-np.sin(t)), R*(1-np.cos(t)), 'b-', lw=2)
    ax.set_title('Cycloid\n$(R(t-\\sin t), R(1-\\cos t))$\nPoint on rolling wheel', fontweight='bold')
    ax.set_aspect('equal'); ax.grid(True,alpha=0.3); ax.set_xlim(0,13); ax.set_ylim(-0.5,3)
    ax.axhline(0,color='gray',lw=1)
    fig.suptitle('Parametric Curves', fontsize=15, fontweight='bold')
    save('9b-parametric-motion.png')

# ============================================================
# 9b-step-parametric.png
# ============================================================
def fig_step_parametric():
    fig, axes = plt.subplots(2, 3, figsize=(15, 10))
    t_full = np.linspace(0, 2*np.pi, 300)
    # Row 1: Circle
    for col, (n, title) in enumerate(zip([6, 12, 300], 
        ['Step 1: t animates point', 'Step 2: More snapshots', 'Step 3: Complete circle'])):
        ax = axes[0,col]
        t_pts = np.linspace(0, 2*np.pi, n)
        ax.plot(3*np.cos(t_pts), 3*np.sin(t_pts), 'b.-', lw=1.5, markersize=4 if n<50 else 1)
        if n < 50:
            ax.plot(3*np.cos(t_pts[-1]), 3*np.sin(t_pts[-1]), 'ro', markersize=6)
        if col == 2:
            ax.arrow(2.8, 1, -0.3, 0.3, head_width=0.15, head_length=0.15, fc='red', ec='red')
        ax.set_title(title, fontweight='bold', fontsize=10)
        ax.set_aspect('equal'); ax.grid(True,alpha=0.3); ax.set_xlim(-4,4); ax.set_ylim(-4,4)
    # Row 2: Cycloid (simplified)
    R = 1
    for col, (n, title) in enumerate(zip([8, 20, 200],
        ['Step 1: t animates wheel', 'Step 2: More snapshots', 'Step 3: Complete cycloid'])):
        ax = axes[1,col]
        t_pts = np.linspace(0, 2*np.pi, n)
        ax.plot(R*(t_pts-np.sin(t_pts)), R*(1-np.cos(t_pts)), 'b.-' if n<100 else 'b-', lw=1.5, markersize=5 if n<50 else 1)
        if n < 50:
            ax.plot(R*(t_pts[-1]-np.sin(t_pts[-1])), R*(1-np.cos(t_pts[-1])), 'ro', markersize=6)
        ax.set_title(title, fontweight='bold', fontsize=10)
        ax.set_aspect('equal'); ax.grid(True,alpha=0.3); ax.set_xlim(0,7); ax.set_ylim(-0.5,2.5)
        ax.axhline(0,color='gray',lw=1)
    fig.suptitle('Building Parametric Curves — Step by Step', fontsize=14, fontweight='bold')
    save('9b-step-parametric.png')

# ============================================================
# 9b-triangle-area-coordinates.png
# ============================================================
def fig_triangle_area_coordinates():
    fig, ax = plt.subplots(figsize=(9, 7))
    tri = np.array([[0,0],[4,0],[1,3],[0,0]])
    ax.fill(tri[:,0], tri[:,1], alpha=0.2, color='blue')
    ax.plot(tri[:,0], tri[:,1], 'b-', lw=2.5)
    ax.plot([0,4,1],[0,0,3], 'ro', markersize=8)
    ax.annotate('(0,0)',(0,0),textcoords="offset points",xytext=(-15,-15),fontsize=11)
    ax.annotate('(4,0)',(4,0),textcoords="offset points",xytext=(5,-15),fontsize=11)
    ax.annotate('(1,3)',(1,3),textcoords="offset points",xytext=(5,5),fontsize=11)
    ax.text(2, 1.5, 'Area = ½|0(0−3)+4(3−0)+1(0−0)|\n         = ½|12| = 6',
            fontsize=13, ha='center', fontweight='bold',
            bbox=dict(boxstyle='round',facecolor='wheat',alpha=0.8))
    ax.set_title('Triangle Area — Shoelace Formula', fontsize=14, fontweight='bold')
    ax.set_aspect('equal'); ax.grid(True,alpha=0.3)
    ax.set_xlim(-1,6); ax.set_ylim(-1,5)
    save('9b-triangle-area-coordinates.png')

# ============================================================
# 9b-area-polygon.png
# ============================================================
def fig_area_polygon():
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(13, 5.5))
    poly = np.array([[0,0],[5,0],[4,3],[1,4],[0,0]])
    # Left: vertices
    ax1.fill(poly[:,0], poly[:,1], alpha=0.15, color='blue')
    ax1.plot(poly[:,0], poly[:,1], 'b-o', lw=2, markersize=8)
    for i,(x,y) in enumerate(poly[:-1]):
        ax1.annotate(f'({x},{y})', (x,y), textcoords="offset points", xytext=(5,10), fontsize=10)
    ax1.set_title('Quadrilateral Vertices\n(counterclockwise)', fontweight='bold')
    ax1.set_aspect('equal'); ax1.grid(True,alpha=0.3)
    ax1.set_xlim(-1,7); ax1.set_ylim(-1,6)
    # Right: diagonal products
    ax2.fill(poly[:,0], poly[:,1], alpha=0.15, color='blue')
    ax2.plot(poly[:,0], poly[:,1], 'b-o', lw=2, markersize=8)
    # Draw cross products visually
    ax2.plot([0,5],[0,3],'r--',lw=1,alpha=0.7)
    ax2.plot([5,4],[0,4],'r--',lw=1,alpha=0.7)
    ax2.plot([4,1],[3,0],'r--',lw=1,alpha=0.7)
    ax2.plot([1,0],[4,0],'r--',lw=1,alpha=0.7)
    ax2.text(2.5, 2, 'Area = ½|0+15+13+0|\n         = 14',
            fontsize=13, ha='center', fontweight='bold',
            bbox=dict(boxstyle='round',facecolor='wheat',alpha=0.8))
    ax2.set_title('Shoelace: Diagonal Products', fontweight='bold')
    ax2.set_aspect('equal'); ax2.grid(True,alpha=0.3)
    ax2.set_xlim(-1,7); ax2.set_ylim(-1,6)
    fig.suptitle('Polygon Area — The Shoelace Formula', fontsize=14, fontweight='bold')
    save('9b-area-polygon.png')

# ============================================================
# 9b-point-reflection.png
# ============================================================
def fig_point_reflection():
    fig, ax = plt.subplots(figsize=(10, 8))
    x = np.linspace(-6, 6, 100)
    ax.plot(x, -x, 'b-', lw=2.5, label='Line: x+y=0')
    ax.plot(1, 5, 'ro', markersize=10)
    ax.plot(-5, -1, 'go', markersize=10)
    ax.plot(-2, 2, 'ko', markersize=6)
    ax.plot([1,-5],[5,-1],'r--',lw=2)
    ax.annotate('P(1,5)',(1,5),textcoords="offset points",xytext=(10,10),fontsize=12,color='red',fontweight='bold')
    ax.annotate("P'(−5,−1)",(-5,-1),textcoords="offset points",xytext=(-25,-20),fontsize=12,color='green',fontweight='bold')
    ax.annotate('Midpoint\n(−2,2)',(-2,2),textcoords="offset points",xytext=(-25,15),fontsize=10,color='black')
    ax.set_title('Point Reflection Across a Line\n$x+y=0$', fontsize=14, fontweight='bold')
    ax.legend(fontsize=11); ax.grid(True,alpha=0.3)
    ax.set_aspect('equal'); ax.set_xlim(-7,7); ax.set_ylim(-7,7)
    ax.axhline(0,color='gray',lw=0.5); ax.axvline(0,color='gray',lw=0.5)
    save('9b-point-reflection.png')

# ============================================================
# Run all
# ============================================================
if __name__ == '__main__':
    print("Generating 9B graphs...")
    fig_line_forms()
    fig_step_line_forms()
    fig_parallel_perpendicular()
    fig_angle_between_lines()
    fig_midpoint_division()
    fig_point_line_distance_derivation()
    fig_step_distance_line()
    fig_two_lines_distance()
    fig_point_circle_distance()
    fig_tangent_lines_circle()
    fig_circle_details()
    fig_step_conic_circle()
    fig_ellipse_details()
    fig_step_conic_ellipse()
    fig_parabola_details()
    fig_step_conic_parabola()
    fig_hyperbola_details()
    fig_step_conic_hyperbola()
    fig_conic_identification()
    fig_conic_comparison()
    fig_parametric_motion()
    fig_step_parametric()
    fig_triangle_area_coordinates()
    fig_area_polygon()
    fig_point_reflection()
    print(f"Done! {25} graphs saved to {OUT}/")
