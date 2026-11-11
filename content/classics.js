/* ============================================================
   Daily Hour — Track 2: Classic papers (15 min)
   28-day cycle. Turbulence foundations interleaved with the
   multiphase / numerics papers your own work rests on.
   Equations are LaTeX (rendered with KaTeX).
   ============================================================ */
window.CLASSICS = [
  {
    title: "Laminar vs. sinuous flow: the birth of the Reynolds number",
    authors: "O. Reynolds", year: 1883, field: "Turbulence",
    cite: "Phil. Trans. R. Soc. Lond. 174, 935–982 (1883)",
    idea: "Reynolds injected dye into water flowing through glass pipes and watched the streak either stay straight (\"direct\") or break up suddenly (\"sinuous\"). He showed that the change is governed by one dimensionless group, not by velocity, diameter or viscosity separately. With a disturbed inlet, turbulence persisted down to roughly 2000; with very quiet inlet water, laminar flow survived to much higher values. Transition is therefore not a single number but depends on the size of disturbances.",
    eq: "\\mathrm{Re} = \\frac{\\rho U D}{\\mu} = \\frac{U D}{\\nu}",
    you: "In your two-phase runs the density and viscosity jump by ~800× and ~50× across the interface, so a single Re hides two very different local Reynolds numbers. Ask: which phase's Re controls your droplet or contact-line case?",
    recall: { q: "Why did Reynolds find more than one 'critical' value?", a: "Because transition depends on the disturbance level at the inlet: a lower bound (~2000) below which disturbances always decay, and much higher values reachable when the inflow is very quiet." }
  },
  {
    title: "Reynolds averaging and the Reynolds stress",
    authors: "O. Reynolds", year: 1895, field: "Turbulence",
    cite: "Phil. Trans. R. Soc. Lond. A 186, 123–164 (1895)",
    idea: "Reynolds split every velocity into a mean and a fluctuation, u = U + u′, and averaged the Navier–Stokes equations. The nonlinear term leaves behind a new unknown, the Reynolds stress −ρ⟨u′v′⟩: momentum carried by the fluctuations. Every RANS model since then is an attempt to close this term. This is the origin of the 'closure problem'.",
    eq: "\\rho\\,\\frac{D U_i}{D t} = -\\frac{\\partial P}{\\partial x_i} + \\frac{\\partial}{\\partial x_j}\\left(\\mu \\frac{\\partial U_i}{\\partial x_j} - \\rho\\,\\overline{u_i' u_j'}\\right)",
    you: "Volume-averaging the interface (your VOF α field) produces the same kind of unclosed term: sub-grid interface fluctuations. Averaged multiphase models (e.g. two-fluid models) face a closure problem of exactly this type.",
    recall: { q: "What new unknown appears when you average Navier–Stokes, and why?", a: "The Reynolds stress −ρ⟨u′ᵢu′ⱼ⟩, because averaging the nonlinear advection term uᵢuⱼ gives UᵢUⱼ plus the correlation of fluctuations." }
  },
  {
    title: "The boundary layer",
    authors: "L. Prandtl", year: 1904, field: "Turbulence",
    cite: "Verh. III. Int. Math.-Kongr., Heidelberg 1904, 484–491 (1905)",
    idea: "In an eight-page talk Prandtl resolved d'Alembert's paradox: at high Reynolds number viscosity matters only in a thin layer next to the wall. Outside it the flow is nearly inviscid; inside it the velocity drops to zero. He also explained separation, where an adverse pressure gradient makes the layer reverse and leave the wall. Asymptotic matching of an inner and outer region became a general method in applied mathematics.",
    eq: "\\frac{\\delta}{x} \\sim \\mathrm{Re}_x^{-1/2}",
    you: "The moving contact line is also an 'inner region' problem: a thin zone near the wall where the usual model breaks down, matched to an outer flow. Cox–Voinov (Day 26) uses exactly Prandtl's inner/outer matching.",
    recall: { q: "How does boundary-layer thickness scale with Reynolds number in laminar flow?", a: "δ/x ∼ Re_x^(−1/2): thinner at higher Reynolds number." }
  },
  {
    title: "Volume of Fluid (VOF)",
    authors: "C. W. Hirt & B. D. Nichols", year: 1981, field: "Multiphase",
    cite: "J. Comput. Phys. 39, 201–225 (1981)",
    idea: "Instead of tracking the interface explicitly, store in each cell the fraction F of the cell occupied by fluid and advect it. Because F is a conserved volume, mass is conserved to machine precision if the fluxes are computed consistently. The original paper used a simple donor–acceptor flux with the interface oriented along a coordinate direction (SLIC-like); later PLIC methods (Day 18) made reconstruction piecewise linear.",
    eq: "\\frac{\\partial F}{\\partial t} + \\mathbf{u}\\cdot\\nabla F = 0 \\quad\\Longleftrightarrow\\quad \\frac{\\partial F}{\\partial t} + \\nabla\\cdot(F\\,\\mathbf{u}) = 0 \\;\\;(\\nabla\\cdot\\mathbf{u}=0)",
    you: "This is the base of your whole thesis. When a committee member asks 'why VOF, not level set?', the answer starts here: exact discrete volume conservation.",
    recall: { q: "What does VOF conserve exactly, and what does it give up compared with level set?", a: "It conserves volume (mass) to machine precision; it gives up a smooth distance function, so normals and curvature are harder to compute accurately." }
  },
  {
    title: "The energy cascade",
    authors: "L. F. Richardson", year: 1922, field: "Turbulence",
    cite: "Weather Prediction by Numerical Process, Cambridge University Press (1922)",
    idea: "In a book that also invented numerical weather prediction, Richardson described turbulence as a cascade: large eddies, fed by the mean flow, break into smaller eddies, which break into smaller ones, until viscosity turns the motion into heat. His famous rhyme: \"Big whirls have little whirls that feed on their velocity, and little whirls have lesser whirls and so on to viscosity.\" The cascade picture is the qualitative skeleton of Kolmogorov's theory 19 years later.",
    eq: "\\varepsilon \\sim \\frac{u_0^3}{\\ell_0} \\quad\\text{(dissipation set by the largest eddies, independent of } \\nu)",
    you: "Richardson also tried the first numerical forecast by hand, using finite differences — the ancestor of every CFD code you write. His forecast failed because of unbalanced initial data, an early lesson in initialization error.",
    recall: { q: "Why is the dissipation rate ε independent of viscosity in the cascade picture?", a: "Energy enters at the large scales at a rate ~u₀³/ℓ₀ and is passed down unchanged; viscosity only sets the scale at which it is finally dissipated, not how much." }
  },
  {
    title: "Statistical theory of turbulence",
    authors: "G. I. Taylor", year: 1935, field: "Turbulence",
    cite: "Proc. R. Soc. Lond. A 151, 421–478 (1935), Parts I–IV",
    idea: "Taylor introduced the idea of isotropic turbulence — statistics that do not depend on direction — and made turbulence a subject of correlations and spectra. He defined the Taylor microscale λ from the curvature of the velocity correlation, and showed that in isotropic turbulence the whole dissipation rate follows from one measurable derivative.",
    eq: "\\varepsilon = 15\\,\\nu \\left\\langle \\left(\\frac{\\partial u}{\\partial x}\\right)^2 \\right\\rangle, \\qquad \\lambda^2 = \\frac{\\langle u^2\\rangle}{\\langle (\\partial u/\\partial x)^2\\rangle}",
    you: "Correlations and spectra are also how you should judge a 'turbulent' multiphase validation case: compare spectra, not only snapshots.",
    recall: { q: "Why is isotropy so useful for measurements?", a: "It reduces the many components of the velocity-gradient tensor to one, so ε can be measured from a single derivative ⟨(∂u/∂x)²⟩." }
  },
  {
    title: "K41: the local structure of turbulence",
    authors: "A. N. Kolmogorov", year: 1941, field: "Turbulence",
    cite: "Dokl. Akad. Nauk SSSR 30, 301–305 (1941); Engl. transl. Proc. R. Soc. Lond. A 434, 9–13 (1991)",
    idea: "Kolmogorov proposed that at very high Reynolds number the small scales forget the large-scale geometry and become universal. They depend only on ε and ν, which gives the smallest (Kolmogorov) scale η. In the inertial range, between the large scales and η, only ε matters, which gives the 2/3 law for structure functions — equivalent to the famous −5/3 energy spectrum (written in spectral form by Obukhov the same year).",
    eq: "\\eta = \\left(\\frac{\\nu^3}{\\varepsilon}\\right)^{1/4}, \\quad \\langle (\\delta u)^2 \\rangle = C_2 (\\varepsilon r)^{2/3}, \\quad E(k) = C\\,\\varepsilon^{2/3} k^{-5/3}",
    you: "Dimensional analysis alone produced the most famous result in turbulence. Before your next derivation, try the Kolmogorov move: list the parameters that matter and see what dimensions force.",
    recall: { q: "From ν and ε only, derive the Kolmogorov length scale.", a: "ν has units m²/s, ε has m²/s³. The only length is η = (ν³/ε)^(1/4)." }
  },
  {
    title: "Continuum Surface Force (CSF)",
    authors: "J. U. Brackbill, D. B. Kothe & C. Zemach", year: 1992, field: "Multiphase",
    cite: "J. Comput. Phys. 100, 335–354 (1992)",
    idea: "Surface tension is a force concentrated on the interface — a delta function. CSF spreads it over a few cells as a volume force, using the gradient of the colour function. The curvature comes from the divergence of the normal. This made surface tension easy to add to any fixed-grid VOF or level-set code, and it is still the default in OpenFOAM's interFoam.",
    eq: "\\mathbf{f}_\\sigma = \\sigma\\,\\kappa\\,\\nabla \\alpha, \\qquad \\kappa = -\\nabla\\cdot\\hat{\\mathbf{n}}, \\quad \\hat{\\mathbf{n}} = \\frac{\\nabla\\alpha}{|\\nabla\\alpha|}",
    you: "The weakness of CSF is curvature error, which creates spurious (parasitic) currents. That is why your curvature and contact-angle treatment matter, and why balanced-force formulations were developed later.",
    recall: { q: "Why do spurious currents appear with CSF?", a: "Errors in the computed curvature κ and an imbalance between the discrete surface-tension force and the discrete pressure gradient leave a net force that drives unphysical flow." }
  },
  {
    title: "The 4/5 law — an exact result",
    authors: "A. N. Kolmogorov", year: 1941, field: "Turbulence",
    cite: "Dokl. Akad. Nauk SSSR 32, 16–18 (1941); Engl. transl. Proc. R. Soc. Lond. A 434, 15–17 (1991)",
    idea: "From the Kármán–Howarth equation Kolmogorov derived one of the very few exact results in turbulence: the third-order longitudinal structure function is negative and linear in r in the inertial range. The negative sign shows that energy flows from large to small scales. Unlike the 2/3 law, this one needs no similarity assumption about higher statistics.",
    eq: "\\left\\langle (\\delta u_\\parallel)^3 \\right\\rangle = -\\tfrac{4}{5}\\,\\varepsilon\\, r",
    you: "Exact results are valuable test cases. In your field, the analogues are exact steady solutions like a static droplet with the Laplace pressure jump — always test those first.",
    recall: { q: "What does the minus sign in the 4/5 law tell you physically?", a: "Energy is transferred on average from large scales to small scales (a forward cascade)." }
  },
  {
    title: "The mixing length",
    authors: "L. Prandtl", year: 1925, field: "Turbulence",
    cite: "Z. Angew. Math. Mech. 5, 136–139 (1925)",
    idea: "By analogy with the mean free path in kinetic theory, Prandtl proposed that a fluid lump travels a distance l_m before mixing with its surroundings. This gives an eddy viscosity proportional to l_m² and the local shear. Near a wall, l_m = κy. Crude, but it was the first practical turbulence model and is still the core of algebraic models.",
    eq: "\\nu_t = l_m^2 \\left|\\frac{dU}{dy}\\right|, \\qquad l_m = \\kappa\\, y",
    you: "Eddy-viscosity ideas also appear in your world as 'interface diffusion' artifacts. Knowing that a model is an analogy (here: with molecular transport) tells you where it will fail.",
    recall: { q: "Where does the mixing-length model fail?", a: "Where turbulence is not in local equilibrium: separated flows, strong curvature, or wherever transport history matters, since ν_t depends only on the local gradient." }
  },
  {
    title: "The law of the wall",
    authors: "Th. von Kármán", year: 1930, field: "Turbulence",
    cite: "Nachr. Ges. Wiss. Göttingen, Math.-Phys. Kl., 58–76 (1930)",
    idea: "Using a similarity hypothesis, von Kármán argued that the mean velocity near a wall follows a universal logarithmic profile in wall units. The constant κ ≈ 0.41 now bears his name. Together with the viscous sublayer (U⁺ = y⁺) and the buffer layer between them, this is the structure every wall function relies on.",
    eq: "U^+ = \\frac{1}{\\kappa}\\ln y^+ + B, \\quad y^+ = \\frac{y\\,u_\\tau}{\\nu}, \\quad \\kappa \\approx 0.41,\\; B \\approx 5.0",
    you: "In OpenFOAM validation, check your first-cell y⁺ before trusting wall-function results — it is one of the first questions a reviewer asks.",
    recall: { q: "What is the friction velocity u_τ?", a: "u_τ = √(τ_w/ρ), the velocity scale built from the wall shear stress." }
  },
  {
    title: "The projection method",
    authors: "A. J. Chorin", year: 1968, field: "Numerics",
    cite: "Math. Comp. 22, 745–762 (1968)",
    idea: "Chorin split each time step into two parts. First, advance velocity ignoring the pressure constraint to get an intermediate u*. Then project u* onto the space of divergence-free fields by solving a Poisson equation for pressure. Temam derived the same idea independently. Pressure becomes a Lagrange multiplier that enforces incompressibility.",
    eq: "\\nabla\\cdot\\left(\\frac{1}{\\rho}\\nabla p^{n+1}\\right) = \\frac{\\nabla\\cdot\\mathbf{u}^*}{\\Delta t}, \\qquad \\mathbf{u}^{n+1} = \\mathbf{u}^* - \\frac{\\Delta t}{\\rho}\\nabla p^{n+1}",
    you: "This is exactly the pressure Poisson equation in your matrix-assembly note. The 1/ρ inside the divergence is what makes the multiphase matrix so ill-conditioned (density ratio ~800).",
    recall: { q: "Why does the variable-density Poisson matrix have a bad condition number?", a: "The coefficients 1/ρ jump by the density ratio across the interface, so the eigenvalues spread over a much wider range than in the single-fluid Laplacian." }
  },
  {
    title: "Two-dimensional turbulence and the inverse cascade",
    authors: "R. H. Kraichnan", year: 1967, field: "Turbulence",
    cite: "Phys. Fluids 10, 1417–1423 (1967)",
    idea: "In 2D, vortex stretching is impossible and both energy and enstrophy (mean-square vorticity) are conserved. Kraichnan showed this forces two cascades: enstrophy goes to small scales (spectrum k⁻³), while energy goes backward to large scales (k⁻⁵/³). This inverse cascade explains large coherent vortices in the atmosphere, oceans and soap films.",
    eq: "E(k) \\propto \\varepsilon^{2/3} k^{-5/3}\\;(k<k_f), \\qquad E(k) \\propto \\eta_\\omega^{2/3} k^{-3}\\;(k>k_f)",
    you: "If you run 2D multiphase test cases with turbulence-like forcing, expect behaviour that is qualitatively different from 3D. This is one reason why 2D results do not transfer to 3D.",
    recall: { q: "Why can't 2D turbulence have a forward energy cascade like 3D?", a: "There is no vortex stretching in 2D and enstrophy is conserved too; conserving both forces energy to move to large scales." }
  },
  {
    title: "K62: intermittency",
    authors: "A. N. Kolmogorov", year: 1962, field: "Turbulence",
    cite: "J. Fluid Mech. 13, 82–85 (1962)",
    idea: "Following Landau's objection that the dissipation rate fluctuates in space, Kolmogorov refined his own theory: ε should be averaged over a ball of size r and its fluctuations assumed lognormal. High-order structure functions then deviate from the K41 prediction p/3. This 'anomalous scaling' or intermittency is still an active research topic.",
    eq: "\\langle (\\delta u)^p \\rangle \\propto r^{\\zeta_p}, \\qquad \\zeta_p = \\frac{p}{3} - \\frac{\\mu\\,p(p-3)}{18}, \\quad \\mu \\approx 0.25",
    you: "A great model of how to respond to criticism: Kolmogorov revised his own famous theory publicly. Your proposal defense will reward the same honesty.",
    recall: { q: "Which structure function is unchanged in K62, and why?", a: "p = 3, because ζ₃ = 1 is fixed by the exact 4/5 law." }
  },
  {
    title: "The moving contact-line paradox",
    authors: "C. Huh & L. E. Scriven", year: 1971, field: "Multiphase",
    cite: "J. Colloid Interface Sci. 35, 85–101 (1971)",
    idea: "Huh and Scriven solved Stokes flow in a wedge near a moving contact line with no-slip on the solid. The viscous stress goes like 1/r, so the force on the solid and the dissipation diverge logarithmically. With the classical model, a contact line could not move at all. Some extra physics must regularize the singularity: slip, precursor films, diffuse interfaces, or molecular effects.",
    eq: "\\tau \\sim \\frac{\\mu U}{r}, \\qquad F \\sim \\mu U \\int_\\lambda^L \\frac{dr}{r} = \\mu U \\ln\\frac{L}{\\lambda}",
    you: "This is the reason your contact-line model needs a slip length or a numerical regularization. Your grid spacing effectively plays the role of λ — so results can depend on resolution. Be ready to discuss this at your defense.",
    recall: { q: "What diverges at a moving contact line with no-slip, and how?", a: "The viscous stress (∼1/r) and hence the total force and dissipation, logarithmically, as ln(L/λ) with λ → 0." }
  },
  {
    title: "The Smagorinsky model",
    authors: "J. Smagorinsky", year: 1963, field: "Turbulence",
    cite: "Mon. Weather Rev. 91, 99–164 (1963)",
    idea: "Working on global weather models, Smagorinsky introduced an eddy viscosity for the scales the grid cannot resolve, proportional to the square of the grid size and the resolved strain rate. This became the first and most widely used subgrid-scale model for Large Eddy Simulation.",
    eq: "\\nu_{sgs} = (C_s \\Delta)^2 |\\bar S|, \\qquad |\\bar S| = \\sqrt{2\\bar S_{ij}\\bar S_{ij}}, \\quad C_s \\approx 0.1\\text{–}0.2",
    you: "Your interface reconstruction is also a subgrid model: it guesses geometry below the grid scale. PLIC-Net is, in that sense, a learned subgrid model.",
    recall: { q: "Why is a constant C_s a problem near walls?", a: "Near walls ν_sgs should vanish, but |S̄| is large there, so constant-C_s Smagorinsky is too dissipative; damping functions or the dynamic model (Day 25) fix this." }
  },
  {
    title: "Streaks and bursts in the turbulent boundary layer",
    authors: "S. J. Kline, W. C. Reynolds, F. A. Schraub & P. W. Runstadler", year: 1967, field: "Turbulence",
    cite: "J. Fluid Mech. 30, 741–773 (1967)",
    idea: "Using hydrogen-bubble visualization, Kline and co-workers found that the near-wall region is not random: it is filled with low- and high-speed streaks spaced about 100 wall units apart. Streaks lift up, oscillate and break up in 'bursts', which produce most of the turbulent energy. This started the study of coherent structures.",
    eq: "\\lambda_z^+ = \\frac{\\lambda_z u_\\tau}{\\nu} \\approx 100",
    you: "Visualization led theory here. Your own spatial error maps for PLIC-Net are the same habit: look before you average.",
    recall: { q: "What is the typical spanwise spacing of near-wall streaks?", a: "About 100 wall units (λ_z⁺ ≈ 100)." }
  },
  {
    title: "PLIC: piecewise-linear interface reconstruction",
    authors: "D. L. Youngs", year: 1982, field: "Multiphase",
    cite: "In K. W. Morton & M. J. Baines (eds.), Numerical Methods for Fluid Dynamics, Academic Press, 273–285 (1982)",
    idea: "Youngs reconstructed the interface in each cell as a straight line (a plane in 3D). The normal comes from a finite-difference gradient of the volume fraction on a 3×3 (3×3×3) stencil; the line is then shifted until it cuts off exactly the cell's volume fraction. Geometric fluxes through the reconstructed shape gave much sharper interfaces than earlier SLIC methods.",
    eq: "\\hat{\\mathbf{n}} = -\\frac{\\nabla_h F}{|\\nabla_h F|}, \\qquad \\text{find } d:\\; V\\big(\\{\\mathbf{x}\\in\\Omega_c: \\hat{\\mathbf{n}}\\cdot\\mathbf{x} \\le d\\}\\big) = F\\,|\\Omega_c|",
    you: "This is the exact step PLIC-Net accelerates: the plane-constant search (your golden-section step) and, at the contact line, the three-phase reconstruction.",
    recall: { q: "What two things does a PLIC reconstruction compute in each cell?", a: "The interface normal (from the gradient of F) and the plane constant d that reproduces the cell's volume fraction." }
  },
  {
    title: "Coherent structures in mixing layers",
    authors: "G. L. Brown & A. Roshko", year: 1974, field: "Turbulence",
    cite: "J. Fluid Mech. 64, 775–816 (1974)",
    idea: "Brown and Roshko's shadowgraphs of a mixing layer between two gases showed large, organized spanwise vortices even at high Reynolds number, persisting and merging downstream. Turbulence was not only chaos: large-scale order coexisted with small-scale randomness. They also measured how the density ratio changes the growth rate.",
    eq: "\\frac{d\\delta}{dx} \\propto \\frac{U_1 - U_2}{U_1 + U_2} \\quad \\text{(growth set by velocity ratio; density ratio modifies it)}",
    you: "Density ratio again! Shear layers between fluids of different density appear in your atomization or droplet problems.",
    recall: { q: "What was surprising about Brown & Roshko's images?", a: "Large coherent vortices existed at high Reynolds number, contradicting the view that fully developed turbulence was purely random." }
  },
  {
    title: "The k–ε model",
    authors: "B. E. Launder & D. B. Spalding", year: 1974, field: "Turbulence",
    cite: "Comput. Methods Appl. Mech. Eng. 3, 269–289 (1974)",
    idea: "Two transport equations — for turbulent kinetic energy k and its dissipation ε — give the eddy viscosity without a prescribed mixing length. The paper fixed the 'standard' constants and the wall-function approach. It became the workhorse of industrial CFD for decades.",
    eq: "\\nu_t = C_\\mu \\frac{k^2}{\\varepsilon}, \\quad C_\\mu = 0.09,\\; C_{1\\varepsilon} = 1.44,\\; C_{2\\varepsilon} = 1.92,\\; \\sigma_k = 1.0,\\; \\sigma_\\varepsilon = 1.3",
    you: "Published in CMAME — one of the journals your tracker follows. When you use k–ε or k–ω SST in OpenFOAM, know which constants you are using and why.",
    recall: { q: "Why two equations instead of one?", a: "One equation (for k) gives a velocity scale; a second (for ε) gives a length scale l ∼ k^(3/2)/ε, so no mixing length must be prescribed." }
  },
  {
    title: "Multigrid",
    authors: "A. Brandt", year: 1977, field: "Numerics",
    cite: "Math. Comp. 31, 333–390 (1977)",
    idea: "Simple iterative methods (Jacobi, Gauss–Seidel) remove high-frequency error fast but stall on smooth error. Brandt's insight: smooth error on a fine grid looks oscillatory on a coarser grid, where it is cheap to remove. Cycling between grids solves elliptic problems like the Poisson equation in O(N) work — optimal.",
    eq: "\\text{work} = O(N), \\qquad \\text{V-cycle: smooth} \\to \\text{restrict } r \\to \\text{solve coarse} \\to \\text{prolong } e \\to \\text{smooth}",
    you: "The direct answer to the condition-number section of your Poisson note: multigrid (or multigrid-preconditioned CG) makes iteration counts nearly independent of grid size. For density-ratio problems, algebraic multigrid handles the coefficient jumps.",
    recall: { q: "Why does a coarse grid help with smooth error?", a: "Smooth error on the fine grid becomes relatively oscillatory on the coarse grid, where smoothers damp it efficiently and the work is much smaller." }
  },
  {
    title: "The first 3D simulation of turbulence",
    authors: "S. A. Orszag & G. S. Patterson", year: 1972, field: "Turbulence",
    cite: "Phys. Rev. Lett. 28, 76–79 (1972)",
    idea: "Orszag and Patterson simulated homogeneous isotropic turbulence on a 32³ grid with a pseudospectral method, computing nonlinear terms in physical space and derivatives in Fourier space. They also showed how to remove aliasing errors. This was the start of Direct Numerical Simulation (DNS).",
    eq: "\\widehat{(u\\,\\omega)}_k \\;\\text{computed via FFT; aliasing removed by the 2/3 rule: } |k| < \\tfrac{2}{3}k_{max}",
    you: "Pseudospectral methods give exponential accuracy for smooth fields but suffer at discontinuities — like a sharp interface. That trade-off is why multiphase codes use finite volumes.",
    recall: { q: "What is aliasing in a pseudospectral method?", a: "Products of resolved modes create wavenumbers beyond the grid that fold back onto resolved ones, corrupting them; the 2/3 rule truncates to prevent it." }
  },
  {
    title: "DNS of turbulent channel flow",
    authors: "J. Kim, P. Moin & R. Moser", year: 1987, field: "Turbulence",
    cite: "J. Fluid Mech. 177, 133–166 (1987)",
    idea: "The first fully resolved simulation of wall turbulence, at Re_τ ≈ 180 with about 4 million grid points. Its statistics — mean profile, Reynolds stresses, budgets — matched experiments and provided quantities experiments cannot measure. It became the benchmark dataset every turbulence model is tested against.",
    eq: "\\mathrm{Re}_\\tau = \\frac{u_\\tau h}{\\nu} \\approx 180",
    you: "Benchmarks like this make a field move. Could your contact-line test cases become a public benchmark for three-phase VOF? That is a strong faculty-application story.",
    recall: { q: "Why was KMM 1987 so influential?", a: "It provided a complete, trustworthy dataset, including terms that cannot be measured experimentally, that every model could be compared against." }
  },
  {
    title: "The immersed boundary method",
    authors: "C. S. Peskin", year: 1972, field: "Multiphase",
    cite: "J. Comput. Phys. 10, 252–271 (1972)",
    idea: "To simulate blood flow through heart valves, Peskin let the elastic boundary live on its own Lagrangian points while the fluid is solved on a fixed Cartesian grid. Forces are spread from boundary to fluid with a smoothed delta function, and the boundary moves with the interpolated fluid velocity. No body-fitted mesh is needed.",
    eq: "\\mathbf{f}(\\mathbf{x},t) = \\int_\\Gamma \\mathbf{F}(s,t)\\,\\delta_h(\\mathbf{x} - \\mathbf{X}(s,t))\\,ds, \\qquad \\frac{\\partial \\mathbf{X}}{\\partial t} = \\int_\\Omega \\mathbf{u}\\,\\delta_h(\\mathbf{x}-\\mathbf{X})\\,d\\mathbf{x}",
    you: "The ancestor of the fictitious-domain FSI method in Pathak & Raessi. Be able to explain how your group's approach differs from Peskin's (e.g., rigid-body constraint vs. elastic forcing).",
    recall: { q: "What two operations couple the fluid and the boundary in IBM?", a: "Spreading (boundary force → fluid grid with δ_h) and interpolation (fluid velocity → boundary points with δ_h)." }
  },
  {
    title: "The dynamic subgrid model",
    authors: "M. Germano, U. Piomelli, P. Moin & W. H. Cabot", year: 1991, field: "Turbulence",
    cite: "Phys. Fluids A 3, 1760–1765 (1991)",
    idea: "Instead of fixing C_s, filter the resolved field a second time with a wider 'test filter'. The difference between the stresses at the two filter levels (the Germano identity) is computable from resolved data, so the model coefficient can be computed locally and in time. The coefficient automatically drops near walls and in laminar regions.",
    eq: "L_{ij} = \\widehat{\\bar u_i \\bar u_j} - \\hat{\\bar u}_i \\hat{\\bar u}_j = T_{ij} - \\hat\\tau_{ij}",
    you: "A model that calibrates itself from resolved data — the same spirit as using fine-grid data to train PLIC-Net. Good analogy for an interview answer on ML + physics.",
    recall: { q: "What does the Germano identity let you compute?", a: "The resolved stress L_ij between grid and test-filter levels, from which the model coefficient is determined dynamically." }
  },
  {
    title: "The Cox–Voinov law for dynamic contact angles",
    authors: "O. V. Voinov (1976); R. G. Cox (1986)", year: 1986, field: "Multiphase",
    cite: "Voinov, Fluid Dyn. 11, 714–721 (1976); Cox, J. Fluid Mech. 168, 169–194 (1986)",
    idea: "By matching an inner region near the contact line (where slip acts, size λ) to an outer region (size L), Voinov and Cox showed that the apparent contact angle depends on the capillary number. The interface bends strongly in the intermediate region; the cube of the angle changes linearly with Ca times a logarithm of scale separation.",
    eq: "\\theta_d^3 = \\theta_m^3 + 9\\,\\mathrm{Ca}\\,\\ln\\frac{L}{\\lambda}, \\qquad \\mathrm{Ca} = \\frac{\\mu U}{\\sigma}",
    you: "Directly relevant to your contact-angle work: if your grid size Δ acts as λ, the apparent angle you see depends on ln(L/Δ). Many dynamic-angle models in VOF codes are built on this law.",
    recall: { q: "Why does the apparent contact angle depend on grid resolution in many VOF codes?", a: "Because the grid size acts like the slip length λ in the Cox–Voinov law, so θ_d changes with ln(L/Δ)." }
  },
  {
    title: "The first LES of channel flow",
    authors: "J. W. Deardorff", year: 1970, field: "Turbulence",
    cite: "J. Fluid Mech. 41, 453–480 (1970)",
    idea: "Deardorff applied Smagorinsky's model to engineering turbulence for the first time, simulating channel flow at high Reynolds number with only 6,720 grid cells. Despite the tiny grid, the large-scale statistics were reasonable. It showed that you need not resolve every eddy to get useful answers.",
    eq: "\\text{resolved} + \\text{modelled}: \\quad \\bar u = G * u, \\quad \\tau_{ij} = \\overline{u_i u_j} - \\bar u_i \\bar u_j",
    you: "Good reminder for your proposal: a first demonstration does not need to be perfect — it needs to open a direction and be honest about limits.",
    recall: { q: "What is the subgrid stress τ_ij?", a: "τ_ij = (u_i u_j)‾ − ū_i ū_j, the effect of unresolved scales on resolved ones, which must be modelled." }
  },
  {
    title: "HHL: a quantum algorithm for linear systems",
    authors: "A. W. Harrow, A. Hassidim & S. Lloyd", year: 2009, field: "Numerics",
    cite: "Phys. Rev. Lett. 103, 150502 (2009)",
    idea: "HHL prepares a quantum state proportional to the solution of Ax = b. It uses phase estimation to find the eigenvalues of A, rotates an ancilla qubit by 1/λ, and uncomputes. For sparse, well-conditioned A the run time grows only like log N — but polynomially in the condition number κ, and the answer is a quantum state, not a list of numbers.",
    eq: "|x\\rangle \\propto A^{-1}|b\\rangle, \\qquad \\text{cost} \\sim \\tilde O\\!\\left(\\log(N)\\, s^2 \\kappa^2 / \\epsilon\\right)",
    you: "Connects directly to your quantum pressure-solver study: κ for your multiphase Poisson matrix is huge, and you need the whole pressure field each step. Explain those two 'fine-print' limits clearly and you will sound like an expert.",
    recall: { q: "Name two reasons HHL does not simply speed up a CFD pressure solve.", a: "Cost grows with the condition number κ (large for refined, multiphase grids), and reading out the full solution vector takes ~N measurements, cancelling the log N advantage." }
  }
];
