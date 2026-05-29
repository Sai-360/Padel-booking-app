package be.ephec.pdw.backend;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;

public abstract class AbstractWebTest {

    @Autowired
    protected MockMvc mockMvc;
}