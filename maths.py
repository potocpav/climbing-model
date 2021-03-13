# %%

from sympy import *
from sympy.solvers import solve
from IPython.display import display

# %% Define the equation specifying the problem

# hand/foot distances from center
r_1x, r_1y, r_2x, r_2y = symbols('r_1x r_1y r_2x r_2y')
# gravitational constant if you want your forces in Newtons
g = symbols('g')


# %% Find the zero-tension solution

A = Matrix([
  [-r_1y, r_1x, 0, 0],
  [0, 0, -r_2y, r_2x],
  [1, 0, 1, 0],
  [0, 1, 0, 1],
  ])
b = Matrix([0, 0, 0, -g])

print("Zero-tension solution:")
f0 = A.inverse_GE() * b
fac = simplify(-1 / A.det())
display(fac)
display(simplify(f0 / fac))

# %% Find the null space

A = Matrix([
  [-r_1y, r_1x, -r_2y, r_2x],
  [1, 0, 1, 0],
  [0, 1, 0, 1],
  ])

b = Matrix([0, 0, -g])

kernel = A.nullspace()[0] * (r_1y - r_2y) * fac
display(kernel)

# %% Parametrize

t = symbols('t')

solution = simplify(f0 + t * kernel)
tension = simplify(solution[1] * r_1x - solution[0] * r_1y)
# display(tension)
assert(tension == t)

display(fac)
simplify(solution / fac)

# %% Minimum hand/feet forces are perpendicular to the wall

min_f1 = solution.dot(Matrix([r_1x - r_2x, r_1y - r_2y, 0, 0]))
t_min_f1 = simplify(solve(min_f1, t)[0])

min_f2 = solution.dot(Matrix([0, 0, r_1x - r_2x, r_1y - r_2y]))
t_min_f2 = simplify(solve(min_f2, t)[0])

display(Eq(t, t_min_f1))
display(Eq(t, t_min_f2))


# %%
