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
eq3 = Eq(r_1x * f_1y - r_1y * f_1x, r_2y * f_2x - r_2x * f_2y)

# %% Three equations for four variables: we will need to parametrize and solve.

t = symbols('t')
eq_t = Eq(f_2y, t)
solution = solve([eq1, eq2, eq3, eq_t], [f_1x, f_1y, f_2x, f_2y])

# %% Squares of vector offsets

f_1 = solution[f_1x] ** 2 + solution[f_1y] ** 2
f_2 = solution[f_2x] ** 2 + solution[f_2y] ** 2

# %% Find the parameter `t` for minimum forces by zeroing the first derivatives

t_a = solve(f_1.diff(t), t)[0]
t_b = solve(f_2.diff(t), t)[0]


# %% Factor out common expression

k = g / ((r_1x - r_2x) ** 2 + (r_1y - r_2y) ** 2)

# %% Substitute solutions and simplify

# minimal f_1
f_1xa = simplify(solution[f_1x].subs(t, t_a) / k)
f_1xb = simplify(solution[f_1x].subs(t, t_b) / k)
f_1ya = simplify(solution[f_1y].subs(t, t_a) / k)
f_1yb = simplify(solution[f_1y].subs(t, t_b) / k)

# minimal f_2
f_2xa = simplify(solution[f_2x].subs(t, t_a) / k)
f_2xb = simplify(solution[f_2x].subs(t, t_b) / k)
f_2ya = simplify(solution[f_2y].subs(t, t_a) / k)
f_2yb = simplify(solution[f_2y].subs(t, t_b) / k)

# %% Print the results
print("Common factor:")
display(k)
print("f_1xa:")
display(f_1xa)
print("f_1xb:")
display(f_1xb)
print("f_1ya:")
display(f_1ya)
print("f_1yb:")
display(f_1yb)
print("f_2xa:")
display(f_2xa)
print("f_2xb:")
display(f_2xb)
print("f_2ya:")
display(f_2ya)
print("f_2yb:")
display(f_2yb)

# %%
