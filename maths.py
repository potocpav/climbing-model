# %%

from sympy import symbols, Eq, simplify, factor
from sympy.solvers import solve
from IPython.display import display

# %% Define the equation specifying the problem

# hand/foot forces
f_1x, f_1y, f_2x, f_2y = symbols('f_1x f_1y f_2x f_2y ')
# hand/foot distances from center
r_1x, r_1y, r_2x, r_2y = symbols('r_1x r_1y r_2x r_2y')
# gravitational constant if you want your forces in Newtons
g = symbols('g')

# zero net force
eq1 = Eq(f_1x + f_2x, 0)
eq2 = Eq(f_1y + f_2y, -g)
# zero net torque
torque_1 = r_1x * f_1y - r_1y * f_1x
torque_2 = r_2x * f_2y - r_2y * f_2x
eq3 = Eq(torque_1, -torque_2)

# %% Three equations for four variables: parametrize, and solve.

t = symbols('t')
eq_t = Eq(f_2y, t)
solution = solve([eq1, eq2, eq3, eq_t], [f_1x, f_1y, f_2x, f_2y])

# %% Find the parameter `t_h` for minimum hand force f_1 by zeroing its first derivative

f_1 = solution[f_1x] ** 2 + solution[f_1y] ** 2
t_h = solve(f_1.diff(t), t)[0]

# %% Find the parameter `t_0` for zero torque


u = symbols('u')
eq_u = Eq(f_2y, u)
solution_0 = solve([eq1, eq2, Eq(torque_1, 0), Eq(torque_2, 0)], [f_1x, f_1y, f_2x, f_2y])
solution_0[f_1x]

# %% Substitute solutions and simplify

k = g / ((r_1x - r_2x) ** 2 + (r_1y - r_2y) ** 2)

# minimal f_1
f_1xa = simplify(solution[f_1x].subs(t, t_h) / k)
f_1ya = simplify(solution[f_1y].subs(t, t_h) / k)
f_2xa = simplify(solution[f_2x].subs(t, t_h) / k)
f_2ya = simplify(solution[f_2y].subs(t, t_h) / k)

l = g / (r_1x * r_2y - r_1y * r_2x)

# minimal f_2
f_1xb = simplify(solution_0[f_1x] / l)
f_1yb = simplify(solution_0[f_1y] / l)
f_2xb = simplify(solution_0[f_2x] / l)
f_2yb = simplify(solution_0[f_2y] / l)

# %% Print the results
print("Common factor:")
display(k)
print("f_1xa:")
display(f_1xa)
print("f_1ya:")
display(f_1ya)
print("f_2xa:")
display(f_2xa)
print("f_2ya:")
display(f_2ya)

print("Common factor:")
display(l)
print("f_1xb:")
display(f_1xb)
print("f_1yb:")
display(f_1yb)
print("f_2xb:")
display(f_2xb)
print("f_2yb:")
display(f_2yb)

# %%
