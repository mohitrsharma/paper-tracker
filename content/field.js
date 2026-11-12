/* ============================================================
   Daily Hour — Track 0: Master your field (15 min)
   21 cards from Mohit's proposal review "Simulating moving solids
   that interact with two-phase interfaces", ordered by how likely
   the committee is to ask about them. Each card: summary, key
   equations, where it sits in the proposal, a committee question
   and an answer outline. Equations checked against the PDFs in
   FSI_Capillary_Review/reference_papers.
   ============================================================ */
window.FIELD = [
  {
    group: "Your solver", title: "The present solver: momentum projection with VOF, and the air film",
    cite: "Ghasemi et al., Comput. Fluids (2014); Pathak & Raessi, J. Comput. Phys. (2016)",
    summary: "Your group's solver extends the fast fictitious-domain method of Sharma & Patankar to two fluids and moving rigid bodies. It reconstructs the solid plane first, then places the liquid–gas PLIC plane in the fluid part of the cell, and fluxes volume geometrically. It works well for partially submerged bodies (hinged plate, pitching cylinder in waves), but in water entry a thin air film stays on the body. Your review traces the film to three features: every face of a cell with any solid gets the rigid velocity; the liquid–gas plane is oriented from neighbouring volume fractions, so a gas layer stays parallel to the wall; and the gas in that cell moves with the body, so the liquid never reaches the solid. The imposed contact angle therefore never acts, and the wall behaves as if θ = 180°.",
    eqs: ["\\mathbf u = \\mathbf U + \\boldsymbol\\omega\\times(\\mathbf x-\\mathbf x_c) \\quad\\text{on every face of a cell with } H>0", "\\theta_{\\text{eff}} \\to 180^\\circ \\;\\Rightarrow\\; U^* \\to 0"],
    where: "Introduction; Sec. 'Implications for the present method'; Algorithm 'Momentum projection' (variant: liquid–gas interface carried by VOF).",
    question: "What exactly causes the air film in your solver, and how do you know it is numerical and not physical?",
    answer: ["Physical air appears only above Duez's U* for the body's contact angle; below U* any film is numerical.", "Three features combine: rigid velocity on all faces of solid cells, plane oriented parallel to the wall, gas carried with the body — so the contact line cannot move.", "This gives a testable prediction: a wetting sphere below U* will show a cavity in our solver, which Do-Quang & Amberg see only for non-wetting spheres.", "Remedies: impose θ through the PLIC plane and curvature; restrict or weight the rigid velocity by solid fraction; conservative hand-over of covered cells."]
  },
  {
    group: "Water-entry physics", title: "Making a splash: the critical speed U* depends on wettability",
    cite: "Duez, Ybert, Clanet & Bocquet, Nature Physics 3, 180–183 (2007)",
    summary: "Spheres dropped into water make an air cavity only above a threshold speed U*. U* scales with the capillary velocity γ/μ and depends strongly on the advancing contact angle. For wetting spheres (θ ≤ 90°) U* ≈ 0.1 γ/μ ≈ 7 m/s in water; for non-wetting spheres it falls like (π − θ)³, to about 2 m/s at 120° and 0.3 m/s at 150°. U* does not depend on sphere diameter (7–25.4 mm) or gas pressure. The mechanism is contact-line stability: above U* the liquid film climbing the sphere detaches before the pole.",
    eqs: ["U^* = \\frac{g_0}{9\\,\\ell\\,\\zeta}\\,\\frac{\\gamma}{\\mu_L}\\,(\\pi-\\theta_0)^3 \\quad (\\theta_0\\ge 90^\\circ),\\qquad \\ell\\approx15,\\;\\zeta\\approx2,\\;g_0\\approx7", "U^* \\approx \\xi\\,\\frac{\\gamma}{\\mu_L},\\quad \\xi\\approx 0.1 \\quad(\\theta_0\\le 90^\\circ)"],
    where: "Sec. 'Numerical modelling of capillary forces' (opening paragraph); validation targets.",
    question: "Why should a numerical method care about the contact angle in a high-speed, inertia-dominated impact?",
    answer: ["Because the experiments show the cavity — a large-scale feature — switches on and off with θ at fixed Weber number.", "U* comes from a contact-line force balance (Cox–Voinov type), so it is microscopic physics controlling macroscopic flow.", "A solver without a wetting condition has an uncontrolled angle, so it cannot reproduce U*(θ).", "Quote numbers: 7 m/s wetting, ~2 m/s at 120°, ~0.3 m/s at 150°."]
  },
  {
    group: "Contact angle on a moving solid", title: "Splash of a sphere with a phase-field wetting condition",
    cite: "Do-Quang & Amberg, Phys. Fluids 21, 022102 (2009)",
    summary: "A Cahn–Hilliard phase-field simulation reproduces Duez's critical speed for cavity formation. The mesh conforms to the sphere, which moves at constant speed, and the computation is done in the sphere's frame. The contact angle enters as a natural wetting boundary condition on the phase field. Cavity formation depends mainly on capillary number and θ. They note that fixed-grid water-entry models before them lacked a proper treatment of wetting.",
    eqs: ["\\alpha\\,\\mathbf n\\cdot\\nabla C = -\\gamma\\,g'(C),\\qquad g(C)=0.5+0.75C-0.25C^3", "\\cos\\theta = \\frac{\\gamma_{sg}-\\gamma_{sl}}{\\gamma_{lg}}"],
    where: "Sec. capillary forces: 'Contact angles on moving solids' (fourth form); validation target for your remedies.",
    question: "Do-Quang & Amberg already reproduced U*. What is new in your proposal?",
    answer: ["Their mesh conforms to the sphere and the sphere moves at prescribed constant speed in its own frame — no free motion, no fixed grid.", "We need a free body moving through a fixed grid with a sharp, mass-conserving VOF at density ratio ~800.", "No fixed-grid method in the review does all of that with θ ≠ 90° (Table of four requirements).", "Their contact-line histories and U* become our validation target."]
  },
  {
    group: "Contact angle on a grid", title: "Mesh-dependent dynamic contact angles in VOF",
    cite: "Afkhami, Zaleski & Bussmann, J. Comput. Phys. 228, 5370–5389 (2009)",
    summary: "VOF advected with face velocities on a no-slip wall has an implicit slip length of about half a cell, so contact-line results change with mesh size (the contact-line height grows logarithmically with refinement). Afkhami et al. use Cox's matched asymptotics to set the angle imposed at the wall, θ_num, as a function of the grid size, so that the apparent angle θ_app converges.",
    eqs: ["G(\\theta_{num}) = G(\\theta_{app}) + \\mathrm{Ca}\\,\\ln\\!\\frac{\\Delta/2}{r_o},\\qquad G(\\theta)\\approx\\frac{\\theta^3}{9}\\;\\text{(small }\\theta)", "\\lambda_{\\text{implicit}} \\approx \\Delta/2"],
    where: "Introduction (mesh sensitivity); 'Where the contact angle sits relative to the no-slip condition'; 'Dynamic contact angles'.",
    question: "Your contact line will depend on grid size. How will you show convergence?",
    answer: ["Admit it: with an implicit slip of Δ/2, the apparent angle depends on ln(Δ).", "Two options: impose a Navier slip resolved by the grid, or use a mesh-dependent θ_num as in Afkhami et al. 2009.", "In our solver the implicit slip in the three-phase cell is zero (rigid velocity on all faces) — a separate issue to fix first.", "Grid study on the contact line itself, not only on body motion (most papers check only the body)."]
  },
  {
    group: "Contact angle on a grid", title: "Height functions and contact angles in 2D VOF",
    cite: "Afkhami & Bussmann, Int. J. Numer. Methods Fluids 57, 453–472 (2008)",
    summary: "Two ways to impose a contact angle in PLIC-VOF: set the orientation of the PLIC plane in the contact-line cell directly from θ, and extend the interface into ghost cells beneath the wall so that height-function curvature can use them (for θ < 45° or > 135°). Height-function curvature converges at the wall with refinement, while gradient-based curvature does not. Both routes were derived for a wall aligned with the cell faces.",
    eqs: ["\\mathbf n_{wall} = \\mathbf n_w\\cos\\theta + \\mathbf t_w\\sin\\theta", "\\kappa = -\\frac{h_{xx}}{(1+h_x^2)^{3/2}}"],
    where: "Sec. 'Where the contact angle is imposed' (routes 2 and 3); 'Implications for the present method'.",
    question: "Which contact-angle route will you implement, and why?",
    answer: ["Route 2 — set the PLIC plane orientation in the contact-line cell from θ — fits our solid-first reconstruction, since we already place the liquid plane in the fluid part of the cell.", "It must be extended from grid-aligned walls to curved walls; in 3D, θ fixes one of the two orientation parameters.", "Curvature near an immersed wall needs a stencil that does not rely on heights through the solid (O'Brien & Bussmann found extension impractical).", "Only works after the air film is removed (rigid-velocity remedy)."]
  },
  {
    group: "Immersed: both sides", title: "Fast computation of rigid particulate flows: momentum projection",
    cite: "Sharma & Patankar, J. Comput. Phys. 205, 439–457 (2005)",
    summary: "Treat the whole domain, solid included, as fluid with density ρ_f(1−H)+ρ_sH. Solve and project as usual, then compute the momentum of the solid region and overwrite the velocity inside with the rigid motion that has that momentum. No Lagrange multiplier iterations — closed form. A slip smeared over one cell remains, and the correction reaches the outer fluid only in the next step. This is the ancestor of your group's solver.",
    eqs: ["M\\mathbf U=\\int_{\\Omega_s}\\rho_s\\hat{\\mathbf u}\\,dV,\\qquad \\mathbf I\\boldsymbol\\omega=\\int_{\\Omega_s}\\mathbf r\\times\\rho_s\\hat{\\mathbf u}\\,dV", "\\mathbf u^{n+1}=\\mathbf U+\\boldsymbol\\omega\\times\\mathbf r \\;\\text{ in } \\Omega_s"],
    where: "Sec. 'Immersed methods that solve on both sides'; Algorithm 'Momentum projection'.",
    question: "How is momentum projection related to the DLM method of Glowinski?",
    answer: ["With the viscous weight γ = 0 in the rigid-body substep, the DLM saddle-point problem has a closed-form solution — the momentum projection (Patankar 2001).", "So it is DLM without Uzawa iterations: cheap and robust.", "Cost: numerical slip smeared over a cell, and the solid fraction is advected rather than moved geometrically in some variants.", "Our solver adds VOF for the liquid–gas interface (Ghasemi 2014, Pathak & Raessi 2016)."]
  },
  {
    group: "Immersed: both sides", title: "Distributed Lagrange multiplier / fictitious domain (DLM/FD)",
    cite: "Glowinski, Pan, Hesla & Joseph, Int. J. Multiphase Flow 25, 755–794 (1999)",
    summary: "The fluid fills the particle as a fictitious fluid, and rigid motion inside the particle is enforced by a Lagrange multiplier on collocation points covering the particle volume. The full time step is a saddle-point system; Marchuk–Yanenko splitting separates a pressure projection, an advection–diffusion step and a rigid-body step solved by Uzawa–conjugate gradients (70–100 iterations in Glowinski 2001, 10–30 in Selçuk 2021). As written, the scheme fails for neutrally buoyant particles because the factor (1 − ρ_f/ρ_s) vanishes.",
    eqs: ["\\begin{bmatrix} A & G & C^T & 0\\\\ G^T & 0 & 0 & 0\\\\ C & 0 & 0 & -R\\\\ 0 & 0 & -R^T & A_p\\end{bmatrix}\\begin{pmatrix}\\mathbf u\\\\ p\\\\ \\boldsymbol\\lambda\\\\ \\mathbf V\\end{pmatrix}=\\begin{pmatrix}\\mathbf r_f\\\\0\\\\0\\\\ \\mathbf r_p\\end{pmatrix}", "A_p=\\Bigl(1-\\frac{\\rho_f}{\\rho_s}\\Bigr)\\frac{1}{\\Delta t}\\begin{bmatrix}M&0\\\\0&\\mathbf I\\end{bmatrix}"],
    where: "Algorithm 'Distributed Lagrange multiplier solved apart from the pressure'.",
    question: "Why does the projection–Uzawa splitting leave a divergence error near the particle?",
    answer: ["The pressure substep makes the field divergence-free; the rigid-body substep then overwrites velocity in the particle, which breaks ∇·u = 0 locally at the surface.", "The error lives in the interface band and decreases with refinement/more coupling.", "Selçuk et al. 2021 moving cylinder is a clean benchmark to measure it.", "Monolithic solves avoid it but cost more (Fadaifard 2014)."]
  },
  {
    group: "Immersed: both sides", title: "Direct forcing on Lagrangian markers",
    cite: "Uhlmann, J. Comput. Phys. 209, 448–476 (2005); Kempe & Fröhlich, J. Comput. Phys. 231 (2012)",
    summary: "Predict the velocity without the solid, interpolate it to surface markers with a smooth kernel, compute the force that brings each marker to the solid velocity in one step, spread it back and re-solve. The projection then disturbs the marker velocity again, leaving slip. Kempe & Fröhlich iterate the forcing a few times (slip falls from about 11–13% to 0.6%) and evaluate the fluid inside the solid by solid-fraction weights, which allows lighter-than-fluid particles; the rigid-fluid assumption is stable only for ρ_s/ρ_f > 1.2.",
    eqs: ["\\mathbf F_l=\\frac{\\mathbf U_d(\\mathbf X_l)-\\tilde{\\mathbf U}_l}{\\Delta t},\\qquad \\mathbf f(\\mathbf x)=\\sum_l\\mathbf F_l\\,\\delta_h(\\mathbf x-\\mathbf X_l)\\,\\Delta V_l", "M\\frac{d\\mathbf U}{dt}=\\rho_f\\frac{d}{dt}\\int_{\\Omega_s}\\mathbf u\\,dV-\\rho_f\\sum_l\\mathbf F_l\\,\\Delta V_l+V_s(\\rho_s-\\rho_f)\\mathbf g"],
    where: "Algorithm 'Direct forcing'.",
    question: "Why is there a term for the fluid inside the solid in the particle equation of motion?",
    answer: ["The surface force alone does not constrain the fictitious fluid inside the particle; its momentum change must be added back.", "Evaluating it as rigid motion is unstable for light particles (ρ_s/ρ_f < 1.2).", "Weighting by solid fraction fixes this — important for light bodies entering water.", "Same issue as added mass for partitioned schemes."]
  },
  {
    group: "Immersed: both sides", title: "Immersed boundary projection method",
    cite: "Taira & Colonius, J. Comput. Phys. 225, 2118–2137 (2007)",
    summary: "Treat the marker forces as a second Lagrange multiplier next to the pressure. The time step becomes one saddle-point system; a block-LU decomposition gives one modified Poisson equation for pressure and marker forces together, solved by conjugate gradients. The new velocity is divergence-free and satisfies no-slip at the markers to machine precision. The fluid inside the solid is not constrained, and solid and fluid have the same density.",
    eqs: ["\\begin{bmatrix} A & G & E^T\\\\ G^T & 0 & 0\\\\ E & 0 & 0\\end{bmatrix}\\begin{pmatrix}\\mathbf q^{n+1}\\\\ \\phi\\\\ \\tilde{\\mathbf f}\\end{pmatrix}=\\begin{pmatrix}\\mathbf r_1\\\\ -\\mathbf{bc}_2\\\\ \\mathbf u_B^{n+1}\\end{pmatrix}", "Q^TB^NQ\\,\\boldsymbol\\lambda=Q^T\\mathbf q^*-\\mathbf r_2,\\qquad Q=[G,\\;E^T]"],
    where: "Algorithm 'Multiplier solved together with the pressure'.",
    question: "Compare Taira–Colonius with DLM: what changes in the constraint row?",
    answer: ["Taira–Colonius: no-slip on surface markers (E row), forces solved with the pressure in one symmetric system.", "DLM: rigidity over the whole particle volume (C row) plus a particle-momentum row; solved apart from the pressure by Uzawa.", "Taira's form has no particle dynamics and equal densities as written.", "Both are saddle-point problems — same mathematical skeleton."]
  },
  {
    group: "Immersed: fluid side", title: "Ghost-cell immersed boundary method",
    cite: "Tseng & Ferziger, J. Comput. Phys. 192, 593–623 (2003); Mittal et al., J. Comput. Phys. 227 (2008)",
    summary: "Solve only on the fluid side. For each ghost point (a solid point with a fluid neighbour), draw a normal through the surface to an image point in the fluid, interpolate the image value, and write one extra equation that imposes the wall condition. The Poisson matrix becomes non-symmetric; Mittal et al. use geometric multigrid with a line Gauss–Seidel smoother. Fresh cells uncovered by the moving body need special treatment, and cell switching causes force oscillations.",
    eqs: ["\\varphi_{GC}+\\varphi_{IP}=2\\varphi_{BI}\\quad\\text{(Dirichlet)}", "\\varphi_{IP}-\\varphi_{GC}=\\Delta l\\,\\Bigl(\\frac{\\partial\\varphi}{\\partial n}\\Bigr)_{BI}\\quad\\text{(Neumann)}"],
    where: "Sec. 'Immersed methods that solve on the fluid side only'; Algorithm 'Sharp interface on the fluid side only'.",
    question: "Could a ghost-cell method impose a contact angle?",
    answer: ["Yes in principle: a contact angle is a Neumann-type condition on a signed-distance level set, the same kind of row as the pressure Neumann condition.", "The cited ghost-cell methods are single-phase, so nobody has done it this way for a moving solid with VOF.", "O'Brien & Bussmann 2018 did VOF contact lines on a ghost-cell IB, but with algebraic advection and a transpiration error.", "Trade-off vs. our fictitious-domain solver: sharp walls vs. geometric VOF in cut cells."]
  },
  {
    group: "Contact angle on a moving solid", title: "Sharp interface IB with level set: what happens without a contact angle",
    cite: "Yang & Stern, J. Comput. Phys. 228, 6590–6616 (2009)",
    summary: "A sharp-interface immersed-boundary/level-set method for wave–body interaction. With the contact-angle condition switched off for a cylinder entering water, the free surface lies along the cylinder (angle ≈ 0) and two air bubbles grow from the surface and rise in the wake — which the authors call non-physical. They impose the angle through the normal derivative of the level set but use only 90°.",
    eqs: ["\\frac{\\partial\\phi}{\\partial n}\\Big|_{wall}=\\cos\\theta\\quad(\\text{signed distance }\\phi;\\ \\text{sign depends on the normal's orientation})"],
    where: "Introduction; 'A method without a wetting condition is not neutral'; Table of four requirements.",
    question: "If you don't impose a contact angle, isn't the method simply neutral?",
    answer: ["No — five observations in the review show an implicit, uncontrolled angle (Yang & Stern bubbles, Sun et al. SPH 'water-repellent coating', Liu, Horgue, Sussman).", "So every water-entry solver has a contact angle; the question is whether it is the right one.", "In our solver the implicit angle is effectively 180°.", "That is why the contact angle is a requirement, not an option."]
  },
  {
    group: "Water-entry physics", title: "Contact-line pinning and cavity formation",
    cite: "Ding, Chen, Liu, Zhang, Gao & Lu, J. Fluid Mech. 783, 504–525 (2015)",
    summary: "Phase-field computations on a Cartesian grid plus experiments. Cavity onset is described by a critical Weber number: for a 90° contact angle it is 13 ± 1 for a disk and 290 ± 5 for a sphere — so a test of U* must use the experiment's body shape. When a cavity forms, the contact line pins 8–12° above the sphere's equator, and the flow separates just below it. Their pinned contact-line position converges on four Cartesian grids. On a non-wetting sphere at low speed a bubble can remain on top.",
    eqs: ["\\mathrm{We}=\\frac{\\rho U^2 D}{\\sigma},\\qquad \\mathrm{We}^*_{disk}\\approx13,\\quad \\mathrm{We}^*_{sphere}\\approx290\\;(\\theta=90^\\circ)"],
    where: "Capillary forces section; 'What the review shows'; validation targets.",
    question: "Which validation case will you run first, and what number will you compare?",
    answer: ["Sphere, θ = 90°: no cavity longer than five radii below We ≈ 290; pinned line 8–12° above the equator when a cavity forms.", "It is on a Cartesian grid, like ours, and shows grid convergence of the contact line.", "Then Do-Quang U*(θ) curve; then Kintea/Aristoff free-falling spheres.", "Compare contact-line position vs time, not only cavity shape."]
  },
  {
    group: "Contact angle on a moving solid", title: "Dynamic contact angle on freely moving and spinning spheres",
    cite: "Kintea, Breitenbach, Thammanna Gurumurthy, Roisman & Tropea, Phys. Fluids 28, 012108 (2016)",
    summary: "Body-fitted VOF simulations of spheres impacting a liquid with a dynamic contact angle from the Kistler model, with hysteresis. For non-rotating spheres a constant angle reproduces cavities and trajectories; spinning spheres need the dynamic angle. They supply validation targets: Aristoff et al. (2010) spheres at 2.17 m/s with θ = 120°, Techet & Truscott (2011) spinning spheres (122° vs 68°), and Lee & Kim small superhydrophobic spheres (154°) that sink or bounce — predicted only when the contact-line force acts on the sphere.",
    eqs: ["\\theta_d=f_H\\!\\left[\\mathrm{Ca}+f_H^{-1}(\\theta_e)\\right],\\qquad f_H(x)=\\arccos\\!\\left\\{1-2\\tanh\\!\\left[5.16\\left(\\frac{x}{1+1.31x^{0.99}}\\right)^{0.706}\\right]\\right\\}"],
    where: "'Dynamic contact angles'; validation targets.",
    question: "Where does your dynamic contact-angle model get the contact-line speed?",
    answer: ["Options in the literature: cell velocities near the wall (Patel, Gohl), fluid velocity relative to the wall at the interface (Kintea), or simply the body speed (Li 2020, following Do-Quang).", "On an immersed wall, cell velocities are less accurate (Patel 2017).", "Start with a static advancing angle (enough for non-rotating spheres), then add Kistler for spinning cases.", "Hysteresis needs advancing and receding values."]
  },
  {
    group: "Contact angle on a moving solid", title: "The closest competitor: phase field with immersed rigid bodies",
    cite: "Reder, Hoffrogge, Schneider & Nestler, Int. J. Numer. Methods Eng. (2022)",
    summary: "A phase-field method in which the solid is also a phase field and the wetting condition acts over its diffuse surface; a body falls freely through a Cartesian grid. They impose 60° and 120° in 2D and keep liquid volume within 0.5%, but the two fluids have a density ratio of only 15. In your review it is the method that comes closest to all four requirements.",
    eqs: ["\\rho_l/\\rho_g = 15\\;\\text{(their runs)}\\quad\\text{vs.}\\quad \\approx 800\\;\\text{(water–air)}"],
    where: "Table of four requirements; highlighted gap statement in 'What the review shows'.",
    question: "Someone has already put contact angles on freely moving bodies on a fixed grid. Why isn't your problem solved?",
    answer: ["Reder et al.: density ratio 15 and 2D; Shentu/Li: water lost into the solid; Yang & Stern: 90° only; Singh: non-conservative level set.", "None meets all four requirements (table).", "Our niche: geometric, mass-conserving VOF at density ratio ~800 with θ ≠ 90° on a body moving through a fixed grid.", "State the highlighted gap sentence from your review word for word."]
  },
  {
    group: "Contact angle on a grid", title: "VOF contact lines on a ghost-cell immersed boundary",
    cite: "O'Brien & Bussmann, Comput. Fluids (2018)",
    summary: "Contact lines on curved immersed walls with a ghost-cell IB and VOF. They replace the computed normal by the contact-line normal where the curvature stencil meets the wall. They explain why geometric VOF is hard with an IB: the liquid–gas plane must lie in the fluid part of the cell. So they advect volume fraction algebraically. Wall-face velocities are interpolated, not zero, giving a transpiration error that vanishes at steady state and decreases with refinement. Pressure error in a static drop grows at small angles on walls not aligned with the grid.",
    eqs: ["\\text{transpiration}:\\; \\mathbf u_{face}\\cdot\\mathbf n_w \\neq 0\\;\\text{(interpolated)}\\;\\to 0 \\text{ with refinement}"],
    where: "'Where the contact angle is imposed' (route 1); 'Liquid volume at the immersed wall'; 'Implications'.",
    question: "What is your advantage over O'Brien & Bussmann?",
    answer: ["Our solver already places the liquid–gas plane in the fluid part of a cut cell and fluxes volume geometrically — exactly what they found hard.", "So we can conserve liquid volume at the wall where they have transpiration.", "What we still need: their kind of wall-aware curvature stencil.", "Fair comparison: they handle curved static walls; we need moving ones."]
  },
  {
    group: "Interface capturing", title: "Level set for incompressible two-phase flow",
    cite: "Sussman, Smereka & Osher, J. Comput. Phys. 114, 146–159 (1994)",
    summary: "The interface is the zero level of a function φ advected with the flow; reinitialization keeps φ a signed distance. It handles topology changes and gives smooth normals and curvature, but it does not conserve volume, which is why level-set water-entry methods appear as 'no' in your mass-conservation column.",
    eqs: ["\\frac{\\partial\\phi}{\\partial t}+\\mathbf u\\cdot\\nabla\\phi=0", "\\frac{\\partial\\phi}{\\partial\\tau}=\\operatorname{sign}(\\phi_0)\\,(1-|\\nabla\\phi|)"],
    where: "Requirement 1 (topology changes without remeshing); Table of requirements.",
    question: "Why VOF and not level set for your problem?",
    answer: ["Exact discrete volume conservation matters at the wall, where small leaks accumulate during long water entries.", "Level set gives easier normals and curvature — that is the price we pay (height functions recover it).", "Coupled level set–VOF (Sussman & Puckett) is a middle path.", "Contact angle on a signed distance is a simple Neumann condition — an advantage of level set we must match."]
  },
  {
    group: "Two-phase numerics", title: "Conservative momentum transport at high density ratio",
    cite: "Nangia, Griffith, Patankar & Bhalla, J. Comput. Phys. 390, 548–594 (2019)",
    summary: "Multiphase solvers with the non-conservative momentum equation become unstable at large density ratios. Transporting mass and momentum consistently — with the same fluxes — keeps the solver stable at water–air ratios and beyond. Your review cites them for the statement that the non-conservative form is stable only up to a density ratio of about 100.",
    eqs: ["\\frac{\\partial(\\rho\\mathbf u)}{\\partial t}+\\nabla\\cdot(\\rho\\mathbf u\\otimes\\mathbf u)=-\\nabla p+\\nabla\\cdot\\bigl[\\mu(\\nabla\\mathbf u+\\nabla\\mathbf u^T)\\bigr]+\\rho\\mathbf g+\\mathbf f_\\sigma", "\\text{mass flux for } \\rho \\;=\\; \\text{the same flux used in } \\rho\\mathbf u"],
    where: "Requirement 2 (conservative, consistent transport across three density jumps).",
    question: "Your problem has three density jumps. Which one worries you most?",
    answer: ["Liquid–gas (~800) throughout, solid–gas before impact, solid–liquid after impact.", "Consistent mass–momentum transport (Bussmann 2002, Nangia 2019) for the liquid–gas jump.", "Solid–liquid: added-mass limits partitioned coupling for light bodies.", "This also makes the pressure Poisson matrix ill-conditioned — link to your condition-number note."]
  },
  {
    group: "Coupling", title: "Curvilinear immersed boundary FSI and added-mass instability",
    cite: "Borazjani, Ge & Sotiropoulos, J. Comput. Phys. 227, 7587–7620 (2008)",
    summary: "FSI of complex 3D rigid bodies with a curvilinear immersed boundary method, comparing loose and strong coupling. In loose (explicit) coupling the fluid force and solid motion are computed once per step; it becomes unstable when the added mass of the fluid exceeds the body's mass, and a smaller time step does not help. Strong coupling iterates with under-relaxation (e.g. Aitken) to convergence.",
    eqs: ["\\text{explicit coupling unstable when } m_{added} > m_s,\\qquad m_{added}\\sim\\rho_f V", "\\omega_{k+1}=-\\omega_k\\frac{(\\mathbf r_k)^T(\\mathbf r_{k+1}-\\mathbf r_k)}{\\|\\mathbf r_{k+1}-\\mathbf r_k\\|^2}\\;\\text{(Aitken)}"],
    where: "Requirement 2; Algorithms (strong vs. loose coupling).",
    question: "Will your solver be stable for a light body entering water?",
    answer: ["Partitioned explicit coupling would not be, regardless of Δt.", "Fictitious-domain/momentum projection treat fluid and solid as one momentum system, which avoids the added-mass instability.", "Still check the light-sphere case (ρ_s/ρ_f < 1) explicitly.", "If needed: strong coupling with Aitken, or AMP-type interface conditions (Banks et al.)."]
  },
  {
    group: "Overset", title: "Ship motions with a level set on dynamic overset grids",
    cite: "Carrica, Wilson, Noack & Stern, Comput. Fluids 36, 1415–1433 (2007)",
    summary: "Body grids move with the ship over a fixed background grid. Points are active, fringe or hole; each fringe point takes its value from a donor cell in the other grid by trilinear interpolation. Donor quality — the share of active points among the donors — must stay above zero or the grids disconnect. A hole point that becomes active directly gets values from a Laplace solve. At a free surface, pressure donors are taken from the water side.",
    eqs: ["\\varphi_{fringe}=\\sum_{k=1}^{8}w_k\\,\\varphi_{donor,k}", "\\nabla^2\\varphi=0 \\;\\text{in hole points, with fringe values as Dirichlet data}"],
    where: "Sec. 'Overset grids'; Algorithm 'Overset grids'; Figure of active/fringe/hole points.",
    question: "Why not use overset grids instead of a fictitious domain?",
    answer: ["Overset resolves the wall layer well and moves bodies far without remeshing.", "But interpolation between grids is not conservative for VOF — geometric VOF interpolation on overset grids is still an open problem (Chang 2021, Wang 2022).", "Pressure oscillates when points change status.", "None of the overset FSI methods reviewed imposes a contact angle."]
  },
  {
    group: "Immersed: both sides", title: "Penalization of obstacles",
    cite: "Angot, Bruneau & Fabrie, Numer. Math. 81, 497–520 (1999)",
    summary: "Model the solid as a porous medium of very small permeability K: add a Brinkman penalty term that drives the velocity to the solid velocity inside the mask. The solution converges to the no-slip solution as K → 0; the term is usually treated implicitly. Variants use a sharp mask or a smooth profile, and weighted averages (Weymouth's boundary data immersion). Penalised VOF contact lines (Horgue 2014) needed the angle one face outside the penalised cells to stay stable.",
    eqs: ["\\rho\\Bigl(\\frac{\\partial\\mathbf u}{\\partial t}+\\mathbf u\\cdot\\nabla\\mathbf u\\Bigr)=-\\nabla p+\\mu\\nabla^2\\mathbf u+\\frac{\\chi}{K}(\\mathbf U_d-\\mathbf u)", "\\mathbf u=\\delta_B\\mathbf U_d+(1-\\delta_B)\\mathbf u_f\\quad\\text{(BDIM weighted average)}"],
    where: "Algorithm 'Penalisation and weighted averages on the grid'; 'Where the contact angle sits relative to the no-slip condition'.",
    question: "Where should the contact angle sit relative to the no-slip condition?",
    answer: ["Horgue et al.: imposing it on the immersed boundary itself was conditionally unstable; they moved it one face outside the penalised cells.", "Patel 2017: at solid-cell vertices, close to but not on the wall.", "Then the contact line moves only through face velocities — implicit slip Δ/2 (Afkhami).", "In our solver the slip in the three-phase cell is zero — we must create some slip for the line to move."]
  },
  {
    group: "Immersed: overview", title: "Immersed boundary methods: history and outlook",
    cite: "Verzicco, Annu. Rev. Fluid Mech. 55, 129–155 (2023)",
    summary: "A review of IB methods from Peskin to today: direct forcing, sharp vs. diffuse, moving bodies, turbulence near immersed walls. A key practical rule your proposal uses: when a fluid layer between two immersed boundaries has fewer than about four grid points, the reconstructions from the two surfaces interfere and give inaccurate or unphysical results — the layer must be refined or modelled (e.g. with lubrication). Also: IB grids have no wall-normal coordinate, so near-wall refinement is expensive.",
    eqs: ["\\text{gap}<4h\\;\\Rightarrow\\;\\text{refine or model the layer}"],
    where: "Requirement 3 (rule for a gas layer thinner than the grid).",
    question: "What will you do when the air layer under the body becomes thinner than a cell?",
    answer: ["Every water entry has this twice: the air cushion before impact and the gas wedge at each contact line.", "None of the methods with a contact angle on a moving solid has a rule for it (review's second highlighted gap).", "Options: local refinement; Liu & Krishnan-style rule — ignore the liquid–gas interface in operators when the layer is sub-cell; a lubrication model.", "Our solver currently has no rule — this is part of the proposed work."]
  }
];

/* Mock-defense bank: hardest and most likely first. */
window.DEFENSE = [
  { q: "In one minute: what is your proposed research, why does it matter, what is new, and can you finish it?", look: ["Importance: water entry with wettability — splash and cavity depend on contact angle (Duez U*).", "Novelty: no fixed-grid method imposes θ ≠ 90° on a moving solid while conserving liquid volume at density ratio ~800.", "Feasibility: build on the existing Pathak & Raessi solver; three concrete remedies; clear validation targets.", "Close with the testable prediction."] },
  { q: "Your solver produces an air film in water entry. Is that a bug, a modelling choice, or physics?", look: ["Physical only above U*; below U* it is numerical.", "Caused by three features: rigid velocity on all faces of solid cells, plane parallel to wall, gas moving with the body.", "Effective contact angle 180°.", "Testable: wetting sphere below U* should still form a cavity in our solver."] },
  { q: "What is the single sentence that states the gap in the literature?", look: ["No fixed-grid method reviewed imposes a contact angle other than 90° on a solid that moves through the grid, conserves the liquid volume and holds a density ratio as large as water and air.", "Second gap: none with a contact angle on a moving solid has a rule for a gas layer thinner than a cell."] },
  { q: "Reder et al. 2022 already impose 60° and 120° on a freely falling body on a Cartesian grid. Why isn't that enough?", look: ["Density ratio 15, not ~800.", "2D only.", "Phase field: diffuse interface, different conservation properties.", "Our target: sharp geometric VOF at water–air ratio in 3D."] },
  { q: "How will you impose the contact angle in a cut cell with a curved, moving wall?", look: ["Route 2: orient the liquid–gas PLIC plane in the contact-line cell from θ (Afkhami & Bussmann).", "Extend from grid-aligned walls to curved walls; in 3D θ fixes one of two angles.", "Curvature stencil that does not use heights through the solid.", "Only effective once the air film is removed."] },
  { q: "Your contact line will be mesh-dependent. How will you demonstrate convergence?", look: ["Implicit slip ~Δ/2 for VOF; zero in our three-phase cell now.", "Grid study on contact-line position and angle, not just body motion.", "Mesh-dependent θ_num (Afkhami 2009) or resolved Navier slip.", "Ding 2015 showed convergence of pinned position on four grids — same target."] },
  { q: "Why a fictitious-domain approach rather than a ghost-cell or cut-cell sharp method?", look: ["Robust for large motion; no fresh/dead-cell force oscillations.", "One momentum system avoids added-mass instability for light bodies.", "Our solver already does geometric VOF in cut cells.", "Trade-off: smeared rigid velocity — which is precisely what we propose to fix (remedy 2)."] },
  { q: "Explain momentum projection on the board, step by step.", look: ["Solve whole domain with mixture density; project to divergence-free û.", "Integrate momentum and angular momentum of û over the solid.", "Overwrite velocity in solid with U + ω × r.", "Move body; slip smeared over one cell remains."] },
  { q: "What happens physically and numerically to the thin air layer just before impact?", look: ["Air cushion thins under the body until it is sub-grid.", "Verzicco: fewer than ~4 points across a layer → unphysical reconstruction.", "Need a rule: refine, model (lubrication) or treat as solid–liquid contact (Liu 2005).", "Pressure under the body is affected; compare early free-surface shape (Zhang 2010)."] },
  { q: "Which validation case comes first, and what number will you compare against?", look: ["Ding 2015 sphere, θ = 90°: no long cavity below We ≈ 290; pinning 8–12° above equator.", "Then Do-Quang U*(θ).", "Then Aristoff 2010: 2.17 m/s, θ = 120°, pinch-off depth and time.", "Techet & Truscott spinning spheres; Lee & Kim bouncing spheres."] },
  { q: "Is your remedy of restricting the rigid velocity to the solid plane going to break mass or momentum conservation?", look: ["The solid fraction must be moved geometrically with the body, not advected by face velocities.", "Weighting by solid fraction as in two-sided methods (Kempe, Patel 2018).", "Need a conservative hand-over when the solid covers a cell (Schneiders 2016).", "Check with a static drop on a moving plate and a translating sphere."] },
  { q: "What is U* for a sphere with θ = 120° in water, and where does that come from?", look: ["About 2 m/s.", "U* = g0 γ (π−θ)³ / (9 ℓ ζ μ) with ℓ≈15, ζ≈2, g0≈7 (Duez 2007).", "From contact-line stability: the film detaches when the dynamic angle reaches 180°.", "Wetting spheres: U* ≈ 0.1 γ/μ ≈ 7 m/s."] },
  { q: "How does the density ratio affect your pressure Poisson solve?", look: ["Coefficients 1/ρ jump by ~800 across the interface — and solid adds another jump.", "Condition number grows; plain CG iterations rise sharply.", "Preconditioning (as in the in-house solver) or multigrid.", "Link to your condition-number study with numbers."] },
  { q: "What could go wrong in your timeline, and what is your fallback?", look: ["Risk: curved-wall contact angle harder than expected.", "Fallback: grid-aligned or axisymmetric cases first, still validate U* trend.", "Risk: thin-layer rule; fallback: refinement + documented limitation.", "Milestones per semester."] },
  { q: "Why should the committee believe this is a PhD and not an engineering fix?", look: ["The review identifies an open problem across four method families.", "New numerical contributions: contact angle in solid-first PLIC on curved moving walls, consistent rigid-velocity treatment, thin-gas rule.", "Validated against physics (U*), not just a code fix.", "Publishable: JCP-type method paper + validation paper."] },
  { q: "You mention a testable prediction. State it precisely and say what result would prove you wrong.", look: ["Prediction: a wetting sphere below U* forms a cavity in the current solver (not in experiments or Do-Quang).", "If no cavity forms, the air-film explanation is incomplete — then look at curvature or momentum transport.", "This is a falsifiable diagnosis — good science."] },
  { q: "How is your work connected to your PLIC-Net and three-phase contact line papers?", look: ["Same solver and same three-phase reconstruction (solid plane + liquid plane).", "PLIC-Net accelerates exactly the reconstruction that the contact-angle remedy changes.", "Published/under-review work proves feasibility of working inside this code.", "Future: ML for the contact-line cell if cost matters."] },
  { q: "If I gave you only one year, what would you finish?", look: ["Remove the air film (rigid-velocity remedy) and demonstrate wetting vs non-wetting entry below U*.", "Static contact angle via PLIC orientation on curved walls.", "One validation: Ding sphere at θ = 90°.", "Dynamic angles and thin-gas rule would become future work."] }
];

window.COACH_TIPS = {
  speaking: [
    "Start every answer with the answer. One sentence, then the reasons. Committees reward the headline first.",
    "Use the 3-point frame: 'There are three reasons…' It buys you time and organises your thoughts.",
    "Replace filler with a pause. Silence for one second sounds confident; 'um' does not. Your counter tracks this.",
    "Aim for 130–150 words per minute. Nervous speakers rush; the pace meter shows your number.",
    "Repeat the question in your own words before answering a hard one. It checks understanding and gives you 3 seconds.",
    "Have one number ready for every claim (7 m/s, 2 m/s, We ≈ 290, density ratio 800). Numbers sound like expertise.",
    "When you don't know: 'I haven't tested that. Based on X, I expect Y, and I would check it by Z.'",
    "Draw while you talk. For equations, say what each term means physically before you write it.",
    "Record yourself once a week and listen. It's uncomfortable and it's the fastest way to improve.",
    "Practise out loud, never only in your head. Speaking is a motor skill; it improves only with repetitions."
  ],
  growth: [
    "Protect the 4:30 hour like a meeting with your advisor: same time, same place, phone in another room.",
    "Finish before you start: close one open task before opening a new thread (OpenFOAM, Overture, quantum can wait two weeks).",
    "Write every day, even 150 words. A proposal is written in many small sessions, not one heroic night.",
    "Sleep is part of the work: memory of what you studied is consolidated during sleep, so a 4:30 start needs an early night.",
    "Once a week, explain your work to someone outside your field. If they understand it, you understand it.",
    "Keep a 'wins' list: papers read, bugs fixed, questions answered. Read it when the PhD feels heavy.",
    "Ask Dr. Raessi precise questions (Gītā 4.34: humility, thorough questioning, service).",
    "Move your body for 20 minutes daily — walking helps thinking and calms the nerves before a defense."
  ]
};
